import ChatHeader from '@/components/ChatHeader'
import supabaseServer from '@/lib/supabase/server'
import React from 'react'



export default async function page() {
  const supabase = await supabaseServer()
  const { data } = await supabase.auth.getSession();
  console.log(data.session?.user)
  
  return (
    <div className="max-w-3xl mx-auto md:py-10 h-screen">
      <div className="h-full border rounded-md">
          <ChatHeader user = {data.session?.user}/>
      </div>
    </div>
  )
}
