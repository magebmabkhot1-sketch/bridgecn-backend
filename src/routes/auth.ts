// backend/src/routes/auth.routes.ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const router = Router()
const prisma = new PrismaClient()

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  university: z.string(),
  studentType: z.enum(['chinese', 'international']),
  yearOfStudy: z.string(),
  interests: z.array(z.string()).optional()
})

router.post('/register', async (req, res) => {
  try {
    const validated = registerSchema.parse(req.body)
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })
    
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        university: validated.university,
        studentType: validated.studentType,
        yearOfStudy: validated.yearOfStudy,
        interests: validated.interests || [],
        languages: ['English'], // Default
        isVerified: false
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        university: true,
        studentType: true,
        yearOfStudy: true,
        interests: true,
        createdAt: true
      }
    })

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      })
    }
    console.error('Register error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

export default router