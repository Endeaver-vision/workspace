'use client'

import { useState, useEffect } from 'react'
import { GraduationCap, BookOpen, Award, ArrowRight, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/types/training.types'

interface WelcomeModalProps {
  userName: string
  userRole: UserRole
  workspaceId: string
  isNewUser?: boolean
}

const steps = [
  {
    icon: BookOpen,
    title: 'Browse Training Materials',
    description: 'Access our library of Standard Operating Procedures and training content.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: GraduationCap,
    title: 'Complete Your Training',
    description: 'Work through assigned SOPs and pass quizzes to demonstrate competency.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: Award,
    title: 'Earn Certificates',
    description: 'Receive certificates upon successful completion of training programs.',
    color: 'bg-amber-100 text-amber-600',
  },
]

export function WelcomeModal({
  userName,
  userRole,
  workspaceId,
  isNewUser = true,
}: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    // Check if user has seen the welcome modal before
    const hasSeenWelcome = localStorage.getItem(`welcome-seen-${workspaceId}`)
    if (isNewUser && !hasSeenWelcome) {
      setIsOpen(true)
    }
  }, [isNewUser, workspaceId])

  const handleClose = () => {
    localStorage.setItem(`welcome-seen-${workspaceId}`, 'true')
    setIsOpen(false)
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleClose()
    }
  }

  const handleSkip = () => {
    handleClose()
  }

  const isLastStep = currentStep === steps.length - 1
  const CurrentIcon = steps[currentStep].icon

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {currentStep === 0
              ? `Welcome to TrainHub, ${userName.split(' ')[0]}!`
              : steps[currentStep].title
            }
          </DialogTitle>
          <DialogDescription>
            {currentStep === 0
              ? `You're logged in as a ${userRole}. Let's get you started.`
              : null
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {/* Step Indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-blue-600'
                    : index < currentStep
                    ? 'bg-blue-300'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Current Step Content */}
          <div className="flex flex-col items-center text-center">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center mb-6 ${steps[currentStep].color}`}>
              <CurrentIcon className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {steps[currentStep].description}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleSkip}>
            Skip Tour
          </Button>
          <Button onClick={handleNext}>
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
