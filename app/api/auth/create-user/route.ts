import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email, password, username, rank, family, can_edit, can_approve } = await req.json()

    if (!email || !password || !username || !rank || !family) {
      return NextResponse.json({ error: 'Campuri lipsa' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      username,
      rank,
      family,
      can_edit: can_edit || false,
      can_approve: can_approve || false,
      is_admin: false,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId: authData.user.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
