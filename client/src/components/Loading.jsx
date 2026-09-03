import { loader2Icon } from 'lucide-react'

const Loading = () => {
  return (
    <div classname='h-screen flex items-center justify-center bg-white'>
        <loader2Icon size={26} className="animate-spin text-zinc-950"/>
    </div>
  )
}

export default Loading