"use client"

import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search products...",
  className = "",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <div
        className={`relative flex items-center transition-all duration-200 ${
          isFocused
            ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
            : "shadow-md hover:shadow-lg"
        } rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700`}
      >
        <Search className="absolute left-3 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="pl-10 pr-10 py-6 text-base border-0 focus-visible:ring-0 bg-transparent"
        />
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange("")}
            className="absolute right-1 h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

