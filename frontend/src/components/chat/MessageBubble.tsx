import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  role: "user" | "assistant"
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
        role === "user"
          ? "ml-auto bg-amber-500 text-black"
          : "mr-auto bg-zinc-800 text-zinc-100",
      )}
    >
      {content}
    </div>
  )
}
