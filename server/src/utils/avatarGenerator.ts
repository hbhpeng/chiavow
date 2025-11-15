import fs from 'fs'
import path from 'path'

const colors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B195', '#C06C84'
]

export const generateAvatar = (userId: string): string => {
  // Get initial from userId
  const initial = userId.charAt(0).toUpperCase()

  // Random background color
  const bgColor = colors[Math.floor(Math.random() * colors.length)]

  // Create SVG avatar
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="${bgColor}"/>
  <text x="100" y="130" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
</svg>`

  // Save to file
  const uploadsDir = path.join(__dirname, '../../uploads')
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
  }

  const filename = `avatar-${userId}.svg`
  const filepath = path.join(uploadsDir, filename)
  fs.writeFileSync(filepath, svg)

  // Return full URL for development
  const port = process.env.PORT || 3001
  return `http://localhost:${port}/uploads/${filename}`
}
