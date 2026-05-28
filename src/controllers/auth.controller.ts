import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
  university: z.string().min(1, { message: 'University is required' }),
  studentType: z.enum(['chinese', 'international'], { 
    errorMap: () => ({ message: 'Invalid student type' }) 
  }),
  yearOfStudy: z.string().min(1, { message: 'Year of study is required' }),
  interests: z.array(z.string()).optional().default([])
})

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
})

export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate input
    const validated = registerSchema.parse(req.body)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validated.email }
    })
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Email already registered',
        error: 'EMAIL_EXISTS'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validated.password, 10)

    // Create user with interests and languages
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        password: hashedPassword,
        firstName: validated.firstName,
        lastName: validated.lastName,
        fullName: `${validated.firstName} ${validated.lastName}`,
        university: validated.university,
        studentType: validated.studentType,
        yearOfStudy: validated.yearOfStudy,
        interests: {
          create: validated.interests.map((interest: string) => ({ interest }))
        },
        languages: {
          create: [{ language: 'English' }]
        },
        isVerified: false,
        userRole: 'USER'
      },
      include: {
        interests: true,
        languages: true
      }
    })

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: '7d' }
    )

    // Transform user data for response
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      university: user.university,
      studentType: user.studentType,
      yearOfStudy: user.yearOfStudy,
      bio: user.bio,
      avatar: user.avatar,
      isVerified: user.isVerified,
      interests: user.interests.map(i => i.interest),
      languages: user.languages.map(l => l.language),
      createdAt: user.createdAt
    }

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userData
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }))
      })
    }
    
    console.error('Register error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'REGISTER_FAILED'
    })
  }
}

export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    // Validate input
    const validated = loginSchema.parse(req.body)
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: {
        interests: true,
        languages: true
      }
    })
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validated.password, user.password)
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        error: 'INVALID_CREDENTIALS'
      })
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret-change-in-production',
      { expiresIn: '7d' }
    )

    // Transform user data
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      university: user.university,
      studentType: user.studentType,
      yearOfStudy: user.yearOfStudy,
      bio: user.bio,
      avatar: user.avatar,
      isVerified: user.isVerified,
      interests: user.interests.map(i => i.interest),
      languages: user.languages.map(l => l.language),
      createdAt: user.createdAt
    }

    return res.json({
      message: 'Login successful',
      token,
      user: userData
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: error.errors
      })
    }
    
    console.error('Login error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'LOGIN_FAILED'
    })
  }
}

export const getProfile = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        interests: true,
        languages: true
      }
    })
    
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      })
    }

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      university: user.university,
      studentType: user.studentType,
      yearOfStudy: user.yearOfStudy,
      bio: user.bio,
      avatar: user.avatar,
      isVerified: user.isVerified,
      interests: user.interests.map(i => i.interest),
      languages: user.languages.map(l => l.language),
      createdAt: user.createdAt
    }

    return res.json({ user: userData })
  } catch (error) {
    console.error('Get profile error:', error)
    return res.status(500).json({ 
      message: 'Internal server error',
      error: 'GET_PROFILE_FAILED'
    })
  }
}