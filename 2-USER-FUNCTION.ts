import { createClient } from 'npm:@supabase/supabase-js@2'

const DEFAULT_ADMIN_EMAIL = 'kgchesterlee@gmail.com'
const DEFAULT_ADMIN_PASSWORD = 'KGadmin123!'
const DEFAULT_ADMIN_NAME = 'KG Admin'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const body = await req.json()
    const action = String(body.action || '')

    // First website visit only: create one temporary Admin automatically.
    if (action === 'ensure-default-admin') {
      const { count, error: countError } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if (countError) throw countError

      if ((count || 0) > 0) return json({ ok: true, created: false })

      const { data: usersData, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) throw listError
      const existing = usersData.users.find((user) => user.email?.toLowerCase() === DEFAULT_ADMIN_EMAIL)

      let userId = existing?.id
      if (existing) {
        const { error } = await admin.auth.admin.updateUserById(existing.id, {
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: DEFAULT_ADMIN_NAME },
        })
        if (error) throw error
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: DEFAULT_ADMIN_EMAIL,
          password: DEFAULT_ADMIN_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: DEFAULT_ADMIN_NAME },
        })
        if (error) throw error
        userId = data.user.id
      }

      const { error: profileError } = await admin.from('profiles').upsert({
        id: userId,
        email: DEFAULT_ADMIN_EMAIL,
        full_name: DEFAULT_ADMIN_NAME,
        role: 'admin',
      })
      if (profileError) throw profileError

      return json({
        ok: true,
        created: true,
        email: DEFAULT_ADMIN_EMAIL,
        temporary_password: DEFAULT_ADMIN_PASSWORD,
      })
    }

    // Every other action requires a real signed-in user.
    const authorization = req.headers.get('Authorization') || ''
    const token = authorization.replace(/^Bearer\s+/i, '')
    if (!token) return json({ error: 'Please sign in again.' }, 401)

    const { data: authData, error: authError } = await admin.auth.getUser(token)
    if (authError || !authData.user) return json({ error: 'Your login expired. Please sign in again.' }, 401)

    const callerId = authData.user.id
    const { data: caller, error: callerError } = await admin
      .from('profiles')
      .select('id,email,full_name,role')
      .eq('id', callerId)
      .single()
    if (callerError || !caller) return json({ error: 'User profile not found.' }, 403)

    // All users may change only their own name, login email and password.
    if (action === 'update-self') {
      const email = String(body.email || '').trim().toLowerCase()
      const fullName = String(body.full_name || '').trim()
      const password = String(body.password || '')

      if (!email || !fullName) return json({ error: 'Name and login email are required.' }, 400)
      if (password && password.length < 8) return json({ error: 'Password must have at least 8 characters.' }, 400)

      const changes: Record<string, unknown> = {
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }
      if (password) changes.password = password

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(callerId, changes)
      if (authUpdateError) throw authUpdateError

      const { error: profileUpdateError } = await admin.from('profiles').update({
        email,
        full_name: fullName,
      }).eq('id', callerId)
      if (profileUpdateError) throw profileUpdateError

      return json({ ok: true })
    }

    if (caller.role !== 'admin') return json({ error: 'Admin access required.' }, 403)

    async function protectLastAdmin(userId: string, nextRole: string) {
      const { data: target, error } = await admin.from('profiles').select('role').eq('id', userId).single()
      if (error) throw error
      if (target.role !== 'admin' || nextRole === 'admin') return

      const { count, error: countError } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
      if (countError) throw countError
      if ((count || 0) <= 1) throw new Error('You must keep at least one Admin account.')
    }

    if (action === 'list') {
      const { data, error } = await admin
        .from('profiles')
        .select('id,email,full_name,role,created_at')
        .order('created_at')
      if (error) throw error
      return json({ users: data || [], current_user_id: callerId })
    }

    if (action === 'create') {
      const email = String(body.email || '').trim().toLowerCase()
      const password = String(body.password || '')
      const fullName = String(body.full_name || '').trim()
      const role = String(body.role || 'basic')

      if (!email || !fullName || password.length < 8) {
        return json({ error: 'Enter a name, login email and password of at least 8 characters.' }, 400)
      }
      if (!['admin', 'operation', 'basic'].includes(role)) return json({ error: 'Invalid role.' }, 400)

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })
      if (error) throw error

      const { error: profileError } = await admin.from('profiles').upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(data.user.id)
        throw profileError
      }
      return json({ ok: true, user_id: data.user.id })
    }

    if (action === 'update-user') {
      const userId = String(body.user_id || '')
      const email = String(body.email || '').trim().toLowerCase()
      const fullName = String(body.full_name || '').trim()
      const role = String(body.role || '')
      const password = String(body.password || '')

      if (!userId || !email || !fullName || !['admin', 'operation', 'basic'].includes(role)) {
        return json({ error: 'Name, login email and a valid role are required.' }, 400)
      }
      if (password && password.length < 8) return json({ error: 'Password must have at least 8 characters.' }, 400)

      await protectLastAdmin(userId, role)

      const changes: Record<string, unknown> = {
        email,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      }
      if (password) changes.password = password

      const { error: authUpdateError } = await admin.auth.admin.updateUserById(userId, changes)
      if (authUpdateError) throw authUpdateError

      const { error: profileUpdateError } = await admin.from('profiles').update({
        email,
        full_name: fullName,
        role,
      }).eq('id', userId)
      if (profileUpdateError) throw profileUpdateError

      return json({ ok: true })
    }

    if (action === 'update-role') {
      const userId = String(body.user_id || '')
      const role = String(body.role || '')
      if (!userId || !['admin', 'operation', 'basic'].includes(role)) {
        return json({ error: 'Invalid user or role.' }, 400)
      }

      await protectLastAdmin(userId, role)
      const { error } = await admin.from('profiles').update({ role }).eq('id', userId)
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'Unknown action.' }, 400)
  } catch (error) {
    console.error(error)
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error.' }, 500)
  }
})
