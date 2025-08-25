'use client';

import { useState } from 'react';
import { 
  Route, 
  Lightbulb, 
  Rocket, 
  Shield, 
  ChevronDown, 
  ChevronRight,
  BarChart3,
  Link,
  Flag,
  FileText,
  AlertTriangle,
  PencilRuler,
  Cog,
  Calculator,
  Network,
  Calendar,
  DollarSign,
  FileText as FileContract,
  Users,
  ClipboardList,
  Compass,
  Hammer,
  Plug,
  ArrowLeftRight,
  ToggleLeft,
  Send,
  Server,
  TrendingUp,
  Headphones,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: NavigationItem[];
  action?: 'tab' | 'scroll';
  target?: string;
}

interface NavigationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onScrollToSection?: (section: string) => void;
}

export function NavigationSidebar({ activeTab, onTabChange, onScrollToSection }: NavigationSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const navigationItems: NavigationItem[] = [
    {
      id: 'workflow',
      label: 'Workflow',
      icon: <Route className="h-4 w-4" />,
      children: [
        {
          id: 'dashboard',
          label: 'Project Dashboard',
          icon: <BarChart3 className="h-4 w-4" />,
          action: 'tab',
          target: 'dashboard'
        },
        {
          id: 'dependencies',
          label: 'Dependencies',
          icon: <Link className="h-4 w-4" />,
          action: 'tab',
          target: 'dependencies'
        },
        {
          id: 'milestones',
          label: 'Milestones',
          icon: <Flag className="h-4 w-4" />,
          action: 'tab',
          target: 'milestones'
        },
        {
          id: 'documents',
          label: 'Documents',
          icon: <FileText className="h-4 w-4" />,
          action: 'tab',
          target: 'documents'
        },
        {
          id: 'risks',
          label: 'Risks',
          icon: <AlertTriangle className="h-4 w-4" />,
          action: 'tab',
          target: 'risks'
        }
      ]
    },
    {
      id: 'tmf',
      label: 'TMF ODA',
      icon: <Network className="h-4 w-4" />,
      children: [
        {
          id: 'tmf-oda-management',
          label: 'TMF ODA Management',
          icon: <Network className="h-4 w-4" />,
          action: 'tab',
          target: 'tmf'
        },
        {
          id: 'tmf-capabilities',
          label: 'TMF Capabilities',
          icon: <FileText className="h-4 w-4" />,
          action: 'tab',
          target: 'tmf'
        },
        {
          id: 'tmf-demo',
          label: 'TMF Demo',
          icon: <Rocket className="h-4 w-4" />,
          action: 'tab',
          target: 'tmf-demo'
        }
      ]
    },
    {
      id: 'presales',
      label: 'Presales',
      icon: <Lightbulb className="h-4 w-4" />,
      children: [
        {
          id: 'solution-design',
          label: 'Solution Design',
          icon: <PencilRuler className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'service-design',
          label: 'Service Design',
          icon: <Cog className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'estimation',
          label: 'Estimation',
          icon: <Calculator className="h-4 w-4" />,
          action: 'tab',
          target: 'estimation'
        },
        {
          id: 'work-breakdown',
          label: 'Work Breakdown',
          icon: <Network className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'scheduling',
          label: 'Scheduling',
          icon: <Calendar className="h-4 w-4" />,
          action: 'tab',
          target: 'scheduling'
        },
        {
          id: 'commercial-model',
          label: 'Commercial Model',
          icon: <DollarSign className="h-4 w-4" />,
          action: 'tab',
          target: 'commercial'
        },
        {
          id: 'contracting',
          label: 'Contracting',
          icon: <FileContract className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'handover',
          label: 'Handover',
          icon: <Users className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        }
      ]
    },
    {
      id: 'delivery',
      label: 'Delivery',
      icon: <Rocket className="h-4 w-4" />,
      children: [
        {
          id: 'governance',
          label: 'Governance',
          icon: <Shield className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'definition',
          label: 'Definition',
          icon: <ClipboardList className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'architecture-design',
          label: 'Architecture & Design',
          icon: <Compass className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'build',
          label: 'Build',
          icon: <Hammer className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'integration-testing',
          label: 'Integration Testing',
          icon: <Plug className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'migration',
          label: 'Migration',
          icon: <ArrowLeftRight className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'cutover',
          label: 'Cutover',
          icon: <ToggleLeft className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'release',
          label: 'Release',
          icon: <Send className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'production-cutover',
          label: 'Production Cutover',
          icon: <Server className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'post-production',
          label: 'Post Production',
          icon: <TrendingUp className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'hypercare',
          label: 'Hypercare',
          icon: <Headphones className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        }
      ]
    },
    {
      id: 'managed-services',
      label: 'Managed Services',
      icon: <Shield className="h-4 w-4" />,
      children: [
        {
          id: 'transitioning',
          label: 'Transitioning',
          icon: <ArrowLeftRight className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'warranty',
          label: 'Warranty',
          icon: <Award className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        },
        {
          id: 'operations-handover',
          label: 'Operations Handover',
          icon: <Users className="h-4 w-4" />,
          action: 'tab',
          target: 'workflow-status'
        }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleNavigationClick = (item: NavigationItem) => {
    if (item.action === 'tab' && item.target) {
      onTabChange(item.target);
    } else if (item.action === 'scroll' && item.target && onScrollToSection) {
      onScrollToSection(item.target);
    }
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedSections.has(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.action === 'tab' && item.target === activeTab;

    return (
      <div key={item.id} className={cn("space-y-1", level > 0 && "ml-4")}>
        <button
          onClick={() => hasChildren ? toggleSection(item.id) : handleNavigationClick(item)}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
            "hover:bg-accent hover:text-accent-foreground",
            level === 0 ? "text-foreground" : "text-muted-foreground",
            isActive && "bg-accent text-accent-foreground",
            hasChildren ? "hover:bg-accent/50" : ""
          )}
        >
          <div className="flex items-center space-x-2">
            {item.icon}
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <div className="flex items-center">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-full overflow-y-auto p-4">
      <div className="mb-6">
        <div className="flex items-center space-x-2 px-3 py-2">
          <Route className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">Navigation</span>
        </div>
      </div>
      
      <nav className="space-y-2">
        {navigationItems.map(item => renderNavigationItem(item))}
      </nav>
    </aside>
  );
}
