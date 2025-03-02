"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "./ui/button"
import { Textarea } from "./ui/textarea"
import { Card, CardContent } from "./ui/card"
import { processTextOnServer } from "@/action"
import { Loader2 } from "lucide-react"

export default function InputForm() {
  const [input, setInput] = useState("")
  const [output, setOutput] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim()) return

    setIsProcessing(true)

    try {
      // Call the server action to process the text on the backend
      const processedText = await processTextOnServer(input)
      setOutput(processedText)
    } catch (error) {
      console.error("Error processing text:", error)
      setOutput("An error occurred while processing your text.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="input" className="block text-sm font-medium mb-2">
            Enter your text:
          </label>
          <Textarea
            id="input"
            placeholder="Type your input here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="min-h-[120px]"
          />
        </div>

        <Button type="submit" className="w-full sm:w-auto" disabled={isProcessing || !input.trim()}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Give me the Right Answer"
          )}
        </Button>
      </form>

      <div>
        <h3 className="text-sm font-medium mb-2">Output:</h3>
        <Card>
          <CardContent className="p-4">
            {output ? (
              <p className="whitespace-pre-wrap break-words">{output}</p>
            ) : (
              <p className="text-muted-foreground italic">Processed text will appear here...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

