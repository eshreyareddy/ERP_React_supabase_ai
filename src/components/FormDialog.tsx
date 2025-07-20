import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'date'
  required?: boolean
  options?: { value: string; label: string }[]
}

interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  fields?: FormField[]
  onSubmit: (formData: FormData | React.FormEvent) => void
  defaultValues?: Record<string, any>
  children?: React.ReactNode
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  onSubmit,
  defaultValues = {},
  children,
}: FormDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (children) {
      // When using children, pass the event directly
      onSubmit(e)
    } else {
      // When using fields, pass FormData
      const formData = new FormData(e.currentTarget)
      onSubmit(formData)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {children ? children : fields?.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              
              {field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  name={field.name}
                  defaultValue={defaultValues[field.name] || ''}
                  required={field.required}
                />
              ) : field.type === 'select' ? (
                <Select name={field.name} defaultValue={defaultValues[field.name] || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  defaultValue={defaultValues[field.name] || ''}
                  required={field.required}
                />
              )}
            </div>
          ))}
          
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {defaultValues.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}