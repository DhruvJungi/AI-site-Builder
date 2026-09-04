import React from 'react'

const LoginLeft = () => {
  return (
    <div className="hidden lg:flex lg:w-2/5 bg-[url('/bg-img.png')] bg-cover bg-center bg-no-repeat flex-col justify-between p-12 shrink-0 select-none">
        <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Logo" className="size-9.5"/>
            <span className="text-4xl font-medium text-white">AI Site Builder</span>
        </div>

        <div>
            <h2 className='text-3xl text-white font-medium leading-snug mb-3 tracking-tight'>Build your presence on web</h2>
            <p className="text-zinc-300">
                Describe what you need and our AI will generate a beautiful website for you in seconds. You can then customize it to your liking and publish it to the web.
            </p>
            <p className="text-zinc-300 text-sm mt-12">Copyright {new Date().getFullYear()} AI-Site-Builder</p>
        </div>

    </div>
  )
}

export default LoginLeft
