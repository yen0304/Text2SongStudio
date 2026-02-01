'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, FileText, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { templatesApi, type Template } from '@/lib/api';

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  onSaveAsTemplate?: () => void;
  canSaveAsTemplate?: boolean;
  disabled?: boolean;
}

export function TemplateSelector({ 
  onSelectTemplate, 
  onSaveAsTemplate,
  canSaveAsTemplate = true,
  disabled = false 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await templatesApi.list({ limit: 100 });
      setTemplates(response.items);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const systemTemplates = templates.filter(t => t.is_system);
  const userTemplates = templates.filter(t => !t.is_system);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isLoading}>
          <FileText className="h-4 w-4 mr-2" />
          Templates
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {systemTemplates.length > 0 && (
          <>
            <DropdownMenuLabel className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              System Templates
            </DropdownMenuLabel>
            {systemTemplates.map(template => (
              <DropdownMenuItem 
                key={template.id}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{template.name}</span>
                  {template.category && (
                    <span className="text-xs text-muted-foreground">{template.category}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {userTemplates.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>My Templates</DropdownMenuLabel>
            {userTemplates.map(template => (
              <DropdownMenuItem 
                key={template.id}
                onClick={() => onSelectTemplate(template)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{template.name}</span>
                  {template.description && (
                    <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {template.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {onSaveAsTemplate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onSaveAsTemplate}
              disabled={!canSaveAsTemplate}
              className={!canSaveAsTemplate ? 'opacity-50' : ''}
            >
              <Plus className="h-4 w-4 mr-2" />
              {canSaveAsTemplate ? 'Save Current as Template' : 'Enter prompt text to save template'}
            </DropdownMenuItem>
          </>
        )}

        {templates.length === 0 && !isLoading && (
          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
            No templates available
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
