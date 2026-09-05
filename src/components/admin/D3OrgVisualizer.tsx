import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Key,
  Users,
  Search,
  CheckCircle2,
  X,
  Sliders,
  Award,
  Building2,
  Lock,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  UserCheck,
  AlertCircle,
  Save,
  RotateCcw as ResetIcon,
  Sparkles,
  Info,
  Edit3,
  ArrowRightLeft,
  Briefcase,
  UserPlus,
  Check,
  Building
} from 'lucide-react';
import { appRepository } from '../../services/store';
import { Employee, Department } from '../../types/domain';
import { SecurityLevel } from '../../types/enums';
import { toast } from '../notifications/ToastContext';

export interface NodePermissionSet {
  canRegisterIncoming: boolean;
  canDispatchOutgoing: boolean;
  canDigitalSign: boolean;
  canAccessTopSecret: boolean;
  canRouteMulti: boolean;
  canArchivePermanent: boolean;
  canDelegate: boolean;
  canBypassSLA: boolean;
}

export interface OrgNodeData {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  managerNameAr: string;
  managerTitleAr: string;
  type: 'apex' | 'directorate' | 'subunit';
  securityClearance: string;
  staffCount: number;
  permissions: NodePermissionSet;
  assignedRoles: Array<{
    roleId: string;
    roleNameAr: string;
    roleNameEn: string;
    employeeNameAr: string;
    employeeCode: string;
  }>;
  children?: OrgNodeData[];
  _children?: OrgNodeData[]; // For D3 collapsing
}

interface D3OrgVisualizerProps {
  locale: 'ar' | 'en';
}

const DEFAULT_PERMISSIONS: Record<number, NodePermissionSet> = {
  1: { // CEO Bureau
    canRegisterIncoming: true,
    canDispatchOutgoing: true,
    canDigitalSign: true,
    canAccessTopSecret: true,
    canRouteMulti: true,
    canArchivePermanent: true,
    canDelegate: true,
    canBypassSLA: true
  },
  2: { // Legal
    canRegisterIncoming: false,
    canDispatchOutgoing: true,
    canDigitalSign: true,
    canAccessTopSecret: true,
    canRouteMulti: true,
    canArchivePermanent: false,
    canDelegate: true,
    canBypassSLA: false
  },
  3: { // Financial
    canRegisterIncoming: false,
    canDispatchOutgoing: true,
    canDigitalSign: true,
    canAccessTopSecret: false,
    canRouteMulti: true,
    canArchivePermanent: false,
    canDelegate: true,
    canBypassSLA: false
  },
  4: { // IT
    canRegisterIncoming: false,
    canDispatchOutgoing: true,
    canDigitalSign: true,
    canAccessTopSecret: false,
    canRouteMulti: true,
    canArchivePermanent: true,
    canDelegate: true,
    canBypassSLA: true
  },
  5: { // HR
    canRegisterIncoming: false,
    canDispatchOutgoing: false,
    canDigitalSign: true,
    canAccessTopSecret: false,
    canRouteMulti: true,
    canArchivePermanent: false,
    canDelegate: true,
    canBypassSLA: false
  },
  6: { // Unified Archive & Central Communications
    canRegisterIncoming: true,
    canDispatchOutgoing: true,
    canDigitalSign: true,
    canAccessTopSecret: true,
    canRouteMulti: true,
    canArchivePermanent: true,
    canDelegate: false,
    canBypassSLA: false
  }
};

export const D3OrgVisualizer: React.FC<D3OrgVisualizerProps> = ({ locale }) => {
  const isAr = locale === 'ar';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Subscribe to appRepository updates so employee role, department, and manager changes reflect in real-time
  const [repoVersion, setRepoVersion] = useState(0);
  useEffect(() => {
    return appRepository.subscribe(() => {
      setRepoVersion(v => v + 1);
    });
  }, []);

  const employees = useMemo(() => appRepository.getEmployees(), [repoVersion]);
  const departments = useMemo(() => appRepository.getDepartments(), [repoVersion]);

  // Department permissions state (supports in-memory real-time modification)
  const [nodePermissions, setNodePermissions] = useState<Record<number, NodePermissionSet>>({
    1: { ...DEFAULT_PERMISSIONS[1] },
    2: { ...DEFAULT_PERMISSIONS[2] },
    3: { ...DEFAULT_PERMISSIONS[3] },
    4: { ...DEFAULT_PERMISSIONS[4] },
    5: { ...DEFAULT_PERMISSIONS[5] },
    6: { ...DEFAULT_PERMISSIONS[6] },
    201: { ...DEFAULT_PERMISSIONS[2], canDigitalSign: false },
    202: { ...DEFAULT_PERMISSIONS[2], canDigitalSign: false },
    301: { ...DEFAULT_PERMISSIONS[3], canDigitalSign: false },
    302: { ...DEFAULT_PERMISSIONS[3], canDigitalSign: false },
    401: { ...DEFAULT_PERMISSIONS[4], canDigitalSign: false },
    402: { ...DEFAULT_PERMISSIONS[4], canDigitalSign: false },
    501: { ...DEFAULT_PERMISSIONS[5], canDigitalSign: false },
    502: { ...DEFAULT_PERMISSIONS[5], canDigitalSign: false },
    601: { ...DEFAULT_PERMISSIONS[6], canArchivePermanent: false },
    602: { ...DEFAULT_PERMISSIONS[6], canRegisterIncoming: false }
  });

  // Modal / Drawer state for Role, Permissions & Department Assignment
  const [activeConfigNode, setActiveConfigNode] = useState<OrgNodeData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'role-dept' | 'permissions' | 'delegations'>('role-dept');
  const [editingPermissions, setEditingPermissions] = useState<NodePermissionSet | null>(null);

  // User Role, Permissions, and Department assignment edit state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(0);
  const [editedJobTitleAr, setEditedJobTitleAr] = useState<string>('');
  const [editedJobTitleEn, setEditedJobTitleEn] = useState<string>('');
  const [editedIsManager, setEditedIsManager] = useState<boolean>(false);
  const [editedDepartmentId, setEditedDepartmentId] = useState<number>(1);
  const [editedSecurityClearance, setEditedSecurityClearance] = useState<SecurityLevel>(SecurityLevel.Confidential);

  // Quick employee transfer / search picker
  const [showTransferPicker, setShowTransferPicker] = useState<boolean>(false);
  const [transferSearchQuery, setTransferSearchQuery] = useState<string>('');

  const [selectedRoleEmployee, setSelectedRoleEmployee] = useState<string>('');
  const [newRoleTitle, setNewRoleTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});

  // Tree Zoom Transform Ref
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Build hierarchical data tree
  const orgTreeData: OrgNodeData = useMemo(() => {
    return {
      id: 1,
      code: 'SEC-01',
      nameAr: 'مكتب معالي الرئيس التنفيذي',
      nameEn: "Executive President's Bureau",
      managerNameAr: 'معالي الدكتور / عبد العزيز بن محمد آل الشيخ',
      managerTitleAr: 'الرئيس التنفيذي للمنظومة',
      type: 'apex',
      securityClearance: 'Level 4 (Top Secret)',
      staffCount: 3,
      permissions: nodePermissions[1] || DEFAULT_PERMISSIONS[1],
      assignedRoles: [
        { roleId: 'r-1', roleNameAr: 'الرئيس التنفيذي (مفوض سيادي)', roleNameEn: 'CEO & Sovereign Signatory', employeeNameAr: 'د. عبد العزيز بن محمد آل الشيخ', employeeCode: 'EMP-001' },
        { roleId: 'r-2', roleNameAr: 'أمين عام مكتب الرئيس', roleNameEn: 'Bureau Secretary General', employeeNameAr: 'أ. أحمد السالم', employeeCode: 'EMP-006' }
      ],
      children: [
        {
          id: 2,
          code: 'LEGAL-02',
          nameAr: 'الإدارة العامة للشؤون القانونية والالتزام',
          nameEn: 'Legal Affairs & Compliance Directorate',
          managerNameAr: 'المستشار / طارق بن فهد السديري',
          managerTitleAr: 'مدير عام الشؤون القانونية',
          type: 'directorate',
          securityClearance: 'Level 3 (Confidential)',
          staffCount: 4,
          permissions: nodePermissions[2] || DEFAULT_PERMISSIONS[2],
          assignedRoles: [
            { roleId: 'r-20', roleNameAr: 'مدير عام الشؤون القانونية', roleNameEn: 'General Director', employeeNameAr: 'المستشار / طارق بن فهد السديري', employeeCode: 'EMP-002' },
            { roleId: 'r-21', roleNameAr: 'مستشار مراجعة العقود واللوائح', roleNameEn: 'Contracts Review Advisor', employeeNameAr: 'أ. ريم الزهراني', employeeCode: 'EMP-014' }
          ],
          children: [
            {
              id: 201,
              code: 'LEG-A',
              nameAr: 'وحدة الاستشارات واللوائح',
              nameEn: 'Legal Consultations Unit',
              managerNameAr: 'المستشار / فهد البواردي',
              managerTitleAr: 'مشرف وحدة الاستشارات',
              type: 'subunit',
              securityClearance: 'Level 3 (Confidential)',
              staffCount: 2,
              permissions: nodePermissions[201] || { ...DEFAULT_PERMISSIONS[2], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-201', roleNameAr: 'مشرف الوحدة', roleNameEn: 'Unit Supervisor', employeeNameAr: 'المستشار / فهد البواردي', employeeCode: 'EMP-015' }
              ]
            },
            {
              id: 202,
              code: 'LEG-B',
              nameAr: 'وحدة العقود والنزاعات الإدارية',
              nameEn: 'Contracts & Litigation Unit',
              managerNameAr: 'أ. ريم الزهراني',
              managerTitleAr: 'مشرفة العقود والنزاعات',
              type: 'subunit',
              securityClearance: 'Level 3 (Confidential)',
              staffCount: 2,
              permissions: nodePermissions[202] || { ...DEFAULT_PERMISSIONS[2], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-202', roleNameAr: 'مشرف وحدة العقود', roleNameEn: 'Contracts Supervisor', employeeNameAr: 'أ. ريم الزهراني', employeeCode: 'EMP-014' }
              ]
            }
          ]
        },
        {
          id: 3,
          code: 'FIN-03',
          nameAr: 'الإدارة العامة للشؤون المالية والميزانية',
          nameEn: 'Financial Affairs & Budgeting',
          managerNameAr: 'الأستاذ / عبد الله بن راشد القحطاني',
          managerTitleAr: 'مدير عام الشؤون المالية',
          type: 'directorate',
          securityClearance: 'Level 3 (Confidential)',
          staffCount: 5,
          permissions: nodePermissions[3] || DEFAULT_PERMISSIONS[3],
          assignedRoles: [
            { roleId: 'r-30', roleNameAr: 'مدير عام الشؤون المالية', roleNameEn: 'General Director', employeeNameAr: 'الأستاذ / عبد الله بن راشد القحطاني', employeeCode: 'EMP-003' }
          ],
          children: [
            {
              id: 301,
              code: 'FIN-A',
              nameAr: 'وحدة المدفوعات والارتباط المالي',
              nameEn: 'Payments & Commitment Unit',
              managerNameAr: 'أ. طلال العسيري',
              managerTitleAr: 'مشرف المدفوعات',
              type: 'subunit',
              securityClearance: 'Level 2 (Restricted)',
              staffCount: 3,
              permissions: nodePermissions[301] || { ...DEFAULT_PERMISSIONS[3], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-301', roleNameAr: 'مدقق مالي أول', roleNameEn: 'Senior Auditor', employeeNameAr: 'أ. طلال العسيري', employeeCode: 'EMP-018' }
              ]
            },
            {
              id: 302,
              code: 'FIN-B',
              nameAr: 'وحدة التخطيط المالي والميزانية',
              nameEn: 'Budget Planning Unit',
              managerNameAr: 'أ. منيرة السالم',
              managerTitleAr: 'مشرفة الميزانية العامة',
              type: 'subunit',
              securityClearance: 'Level 2 (Restricted)',
              staffCount: 2,
              permissions: nodePermissions[302] || { ...DEFAULT_PERMISSIONS[3], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-302', roleNameAr: 'أخصائي ميزانيات', roleNameEn: 'Budget Specialist', employeeNameAr: 'أ. منيرة السالم', employeeCode: 'EMP-019' }
              ]
            }
          ]
        },
        {
          id: 4,
          code: 'TECH-04',
          nameAr: 'الإدارة العامة للتحول الرقمي وتقنية المعلومات',
          nameEn: 'Digital Transformation & IT Directorate',
          managerNameAr: 'المهندس / فيصل بن سلطان الحربي',
          managerTitleAr: 'مدير عام التحول الرقمي',
          type: 'directorate',
          securityClearance: 'Level 3 (Confidential)',
          staffCount: 7,
          permissions: nodePermissions[4] || DEFAULT_PERMISSIONS[4],
          assignedRoles: [
            { roleId: 'r-40', roleNameAr: 'مدير عام التحول الرقمي', roleNameEn: 'IT General Director', employeeNameAr: 'م. فيصل بن سلطان الحربي', employeeCode: 'EMP-004' }
          ],
          children: [
            {
              id: 401,
              code: 'TEC-A',
              nameAr: 'قسم البنية التحتية والأمن السيبراني',
              nameEn: 'Infrastructure & Cybersecurity',
              managerNameAr: 'م. عمر بن خالد',
              managerTitleAr: 'رئيس قسم الأمن السيبراني',
              type: 'subunit',
              securityClearance: 'Level 3 (Confidential)',
              staffCount: 4,
              permissions: nodePermissions[401] || { ...DEFAULT_PERMISSIONS[4], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-401', roleNameAr: 'مسؤول أمن المعلومات', roleNameEn: 'Security Officer', employeeNameAr: 'م. عمر بن خالد', employeeCode: 'EMP-022' }
              ]
            },
            {
              id: 402,
              code: 'TEC-B',
              nameAr: 'قسم تطوير الأنظمة والاتصالات الإدارية',
              nameEn: 'Systems & Gov Integration',
              managerNameAr: 'م. فهد القاسم',
              managerTitleAr: 'رئيس قسم الأنظمة',
              type: 'subunit',
              securityClearance: 'Level 2 (Restricted)',
              staffCount: 3,
              permissions: nodePermissions[402] || { ...DEFAULT_PERMISSIONS[4], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-402', roleNameAr: 'مطور تكامل الأنظمة (GSB)', roleNameEn: 'Integration Lead', employeeNameAr: 'م. فهد القاسم', employeeCode: 'EMP-023' }
              ]
            }
          ]
        },
        {
          id: 5,
          code: 'HR-05',
          nameAr: 'الإدارة العامة للموارد البشرية والتدريب',
          nameEn: 'Human Capital & Development',
          managerNameAr: 'الأستاذة / نورة بنت خالد التميمي',
          managerTitleAr: 'مدير عام الموارد البشرية',
          type: 'directorate',
          securityClearance: 'Level 2 (Restricted)',
          staffCount: 5,
          permissions: nodePermissions[5] || DEFAULT_PERMISSIONS[5],
          assignedRoles: [
            { roleId: 'r-50', roleNameAr: 'مدير عام الموارد البشرية', roleNameEn: 'HR General Director', employeeNameAr: 'أ. نورة بنت خالد التميمي', employeeCode: 'EMP-005' }
          ],
          children: [
            {
              id: 501,
              code: 'HR-A',
              nameAr: 'وحدة عمليات الموارد البشرية والرواتب',
              nameEn: 'HR Operations & Payroll',
              managerNameAr: 'أ. مشاعل الشمري',
              managerTitleAr: 'مشرفة شؤون الموظفين',
              type: 'subunit',
              securityClearance: 'Level 2 (Restricted)',
              staffCount: 3,
              permissions: nodePermissions[501] || { ...DEFAULT_PERMISSIONS[5], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-501', roleNameAr: 'مسؤول الرواتب والبدلات', roleNameEn: 'Payroll Officer', employeeNameAr: 'أ. مشاعل الشمري', employeeCode: 'EMP-026' }
              ]
            },
            {
              id: 502,
              code: 'HR-B',
              nameAr: 'وحدة التدريب وتطوير الكفاءات',
              nameEn: 'Talent Training Unit',
              managerNameAr: 'أ. زياد الغامدي',
              managerTitleAr: 'مشرف التدريب',
              type: 'subunit',
              securityClearance: 'Level 1 (General)',
              staffCount: 2,
              permissions: nodePermissions[502] || { ...DEFAULT_PERMISSIONS[5], canDigitalSign: false },
              assignedRoles: [
                { roleId: 'r-502', roleNameAr: 'أخصائي تطوير كوادر', roleNameEn: 'Talent Specialist', employeeNameAr: 'أ. زياد الغامدي', employeeCode: 'EMP-027' }
              ]
            }
          ]
        },
        {
          id: 6,
          code: 'ARCH-06',
          nameAr: 'مركز الوثائق والاتصالات الإدارية الموحدة',
          nameEn: 'Unified Archive & Communications Center',
          managerNameAr: 'الأستاذ / خالد بن ناصر الدوسري',
          managerTitleAr: 'مدير مركز الوثائق الموحدة',
          type: 'directorate',
          securityClearance: 'Level 3 (Confidential)',
          staffCount: 7,
          permissions: nodePermissions[6] || DEFAULT_PERMISSIONS[6],
          assignedRoles: [
            { roleId: 'r-60', roleNameAr: 'مدير المركز المركزي', roleNameEn: 'Center Director', employeeNameAr: 'أ. خالد بن ناصر الدوسري', employeeCode: 'EMP-007' }
          ],
          children: [
            {
              id: 601,
              code: 'ARC-A',
              nameAr: 'وحدة القيد المركزي والاتصالات الحكومية (GSB)',
              nameEn: 'Central Entry & GSB Gov Gateway',
              managerNameAr: 'أ. أحمد بن عبد الله السالم',
              managerTitleAr: 'رئيس وحدة القيد المركزي',
              type: 'subunit',
              securityClearance: 'Level 3 (Confidential)',
              staffCount: 4,
              permissions: nodePermissions[601] || { ...DEFAULT_PERMISSIONS[6], canArchivePermanent: false },
              assignedRoles: [
                { roleId: 'r-601', roleNameAr: 'أمين القيد والمخاطبات', roleNameEn: 'Registry Officer', employeeNameAr: 'أ. أحمد بن عبد الله السالم', employeeCode: 'EMP-006' }
              ]
            },
            {
              id: 602,
              code: 'ARC-B',
              nameAr: 'وحدة الفهرسة والأرشفة الرقمية والحفظ الدائم',
              nameEn: 'Indexing & Electronic Permanent Archive',
              managerNameAr: 'أ. سارة بنت محمد القحطاني',
              managerTitleAr: 'مشرفة الأرشفة الرقمية',
              type: 'subunit',
              securityClearance: 'Level 3 (Confidential)',
              staffCount: 3,
              permissions: nodePermissions[602] || { ...DEFAULT_PERMISSIONS[6], canRegisterIncoming: false },
              assignedRoles: [
                { roleId: 'r-602', roleNameAr: 'أخصائي أرشفة رقمية', roleNameEn: 'Archive Specialist', employeeNameAr: 'أ. سارة بنت محمد القحطاني', employeeCode: 'EMP-008' }
              ]
            }
          ]
        }
      ]
    };
  }, [nodePermissions, departments, employees]);

  // Open Click-to-Edit Modal
  const handleOpenEditModal = useCallback((nodeData: OrgNodeData, initialTab: 'role-dept' | 'permissions' | 'delegations' = 'role-dept') => {
    setActiveConfigNode(nodeData);
    setActiveModalTab(initialTab);

    // Map node id to department ID
    const mappedDeptId = nodeData.id > 100 ? Math.floor(nodeData.id / 100) : nodeData.id;
    const currentEmps = appRepository.getEmployees();
    const currentDepts = appRepository.getDepartments();
    const deptEmps = currentEmps.filter(e => e.departmentId === mappedDeptId);
    const matchedDept = currentDepts.find(d => d.id === mappedDeptId);

    // Select manager or first employee in dept
    const initialEmp =
      deptEmps.find(e => e.id === matchedDept?.managerId) ||
      deptEmps.find(e => e.isManager) ||
      deptEmps[0] ||
      currentEmps[0];

    if (initialEmp) {
      setSelectedEmployeeId(initialEmp.id);
      setEditedJobTitleAr(initialEmp.jobTitleAr || nodeData.managerTitleAr);
      setEditedJobTitleEn(initialEmp.jobTitleEn || '');
      setEditedIsManager(Boolean(initialEmp.isManager || (matchedDept && initialEmp.id === matchedDept.managerId)));
      setEditedDepartmentId(initialEmp.departmentId);
      setEditedSecurityClearance(initialEmp.securityClearance);
    }

    setEditingPermissions({ ...nodeData.permissions });
    setSelectedRoleEmployee('');
    setNewRoleTitle('');
    setShowTransferPicker(false);
    setTransferSearchQuery('');
    setIsModalOpen(true);
  }, []);

  // Backward compatibility wrapper for permission click
  const handleOpenPermissionModal = useCallback((nodeData: OrgNodeData) => {
    handleOpenEditModal(nodeData, 'permissions');
  }, [handleOpenEditModal]);

  // Switch selected employee inside modal
  const handleSelectEmployee = (empId: number) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    setSelectedEmployeeId(emp.id);
    setEditedJobTitleAr(emp.jobTitleAr);
    setEditedJobTitleEn(emp.jobTitleEn || '');
    setEditedIsManager(Boolean(emp.isManager));
    setEditedDepartmentId(emp.departmentId);
    setEditedSecurityClearance(emp.securityClearance);
    setShowTransferPicker(false);
  };

  // Toggle Collapse
  const handleToggleCollapse = useCallback((nodeId: number) => {
    setCollapsedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);

  // Render D3 Organizational Tree Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svgElement = svgRef.current;
    const container = containerRef.current;
    const width = container.clientWidth || 1000;
    const height = 650;

    // Clear previous elements
    d3.select(svgElement).selectAll('*').remove();

    const svg = d3
      .select(svgElement)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Main Zoomable Group
    const g = svg.append('g').attr('class', 'org-chart-main-group');

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 2.2])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Filter collapsed nodes for D3 hierarchy
    const cloneTree = (node: OrgNodeData): OrgNodeData => {
      const isCollapsed = !!collapsedNodes[node.id];
      const newNode: OrgNodeData = { ...node };
      if (node.children) {
        if (isCollapsed) {
          newNode._children = node.children.map(cloneTree);
          newNode.children = undefined;
        } else {
          newNode.children = node.children.map(cloneTree);
        }
      }
      return newNode;
    };

    const rootData = cloneTree(orgTreeData);
    const root = d3.hierarchy<OrgNodeData>(rootData);

    // D3 Tree Layout configuration
    // Node dimensions: card width 240, card height 130
    const nodeWidth = 240;
    const nodeHeight = 135;
    const siblingSeparation = 1.15;
    const levelSeparation = 180;

    const treeLayout = d3
      .tree<OrgNodeData>()
      .nodeSize([nodeWidth * siblingSeparation, levelSeparation]);

    treeLayout(root);

    // Initial Center Transform
    const initialTransform = d3.zoomIdentity.translate(width / 2, 80).scale(0.85);
    svg.call(zoom.transform, initialTransform);

    // Draw Stepped Orthogonal Link Curves
    g.selectAll('.org-link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'org-link')
      .attr('d', d => {
        const sourceX = d.source.x ?? 0;
        const sourceY = (d.source.y ?? 0) + nodeHeight / 2;
        const targetX = d.target.x ?? 0;
        const targetY = (d.target.y ?? 0) - nodeHeight / 2;
        const midY = (sourceY + targetY) / 2;
        return `M ${sourceX} ${sourceY} V ${midY} H ${targetX} V ${targetY}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#6366f1')
      .attr('stroke-opacity', 0.45)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', d => (d.target.data.type === 'subunit' ? '4 3' : 'none'));

    // Draw Nodes Container
    const node = g
      .selectAll('.org-node')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('class', d => `org-node node-id-${d.data.id}`)
      .attr('transform', d => `translate(${(d.x ?? 0) - nodeWidth / 2}, ${(d.y ?? 0) - nodeHeight / 2})`);

    // Add HTML card inside foreignObject for pixel-perfect modern styling
    node
      .append('foreignObject')
      .attr('width', nodeWidth)
      .attr('height', nodeHeight + 20)
      .html(d => {
        const data = d.data;
        const isApex = data.type === 'apex';
        const isSubunit = data.type === 'subunit';
        const isCollapsed = !!collapsedNodes[data.id];
        const hasChildren = (data.children && data.children.length > 0) || (data._children && data._children.length > 0);

        // Count enabled permissions
        const enabledPermsCount = Object.values(data.permissions).filter(Boolean).length;

        // Search match highlight
        const isMatch =
          searchQuery.trim().length > 0 &&
          (data.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            data.managerNameAr.toLowerCase().includes(searchQuery.toLowerCase()));

        const borderClass = isMatch
          ? 'border-amber-500 ring-2 ring-amber-400 bg-amber-50/20'
          : isApex
          ? 'border-indigo-600 bg-gradient-to-b from-indigo-50/90 to-white dark:from-indigo-950/70 dark:to-slate-900 ring-1 ring-indigo-500/30'
          : isSubunit
          ? 'border-slate-300 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-900/90'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';

        return `
          <div 
            xmlns="http://www.w3.org/1999/xhtml" 
            data-action="click-to-edit" 
            data-id="${data.id}"
            class="w-[${nodeWidth}px] select-none p-2.5 rounded-xl border-2 transition-all duration-200 cursor-pointer hover:border-indigo-500 hover:shadow-md hover:-translate-y-0.5 ${borderClass} relative group shadow-sm"
            title="${isAr ? 'انقر لتعديل المنصب أو الصلاحيات أو التبعية الإدارية' : 'Click to edit role, permissions, or department'}"
          >
            
            <!-- Header Row: Code, Edit Button & Clearance Badge -->
            <div class="flex items-center justify-between text-[9px] font-mono mb-1">
              <div class="flex items-center gap-1">
                <span class="font-bold px-1.5 py-0.5 rounded ${
                  isApex
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }">${data.code}</span>
                
                <span 
                  data-action="click-to-edit" 
                  data-id="${data.id}" 
                  class="px-1 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-sans font-bold flex items-center gap-0.5 opacity-80 group-hover:opacity-100 hover:bg-indigo-600 hover:text-white transition"
                  title="${isAr ? 'تعديل المنصب والصلاحيات' : 'Edit Role & Permissions'}"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  <span>${isAr ? 'تعديل' : 'Edit'}</span>
                </span>
              </div>
              
              <span class="px-1.5 py-0.5 rounded font-semibold ${
                data.securityClearance.includes('Top Secret')
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }">
                ${data.securityClearance.split(' ')[0]}
              </span>
            </div>

            <!-- Title -->
            <div class="text-[11px] font-bold text-slate-900 dark:text-slate-100 truncate text-start" title="${data.nameAr}">
              ${data.nameAr}
            </div>

            <!-- Manager -->
            <div class="text-[10px] text-slate-600 dark:text-slate-400 truncate text-start mt-0.5 flex items-center gap-1">
              <span class="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
              <span class="truncate">${data.managerNameAr}</span>
            </div>

            <!-- Footer: Personnel Count & Permissions Trigger Button -->
            <div class="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
              <span class="text-slate-500 font-mono flex items-center gap-1">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                ${data.staffCount} ${isAr ? 'منسوبين' : 'staff'}
              </span>

              <!-- Action: Manage Permissions & Roles -->
              <button 
                data-action="permissions" 
                data-id="${data.id}"
                class="px-2 py-0.5 rounded-lg text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800"
              >
                <span>${isAr ? 'الصلاحيات' : 'Roles'}</span>
                <span class="font-mono bg-indigo-200 dark:bg-indigo-800 text-indigo-900 dark:text-indigo-100 px-1 rounded-full text-[8px]">${enabledPermsCount}</span>
              </button>
            </div>

            <!-- Branch Collapse / Expand Indicator Pill -->
            ${
              hasChildren
                ? `
              <div 
                data-action="toggle-collapse"
                data-id="${data.id}"
                class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white dark:bg-slate-800 border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold shadow-xs cursor-pointer hover:scale-110 transition"
                title="${isCollapsed ? 'توسيع التفرعات' : 'طي التفرعات'}"
              >
                ${isCollapsed ? '+' : '−'}
              </div>
            `
                : ''
            }
          </div>
        `;
      });

    // Attach native DOM event listener inside SVG foreignObjects
    const foreignElements = svgElement.querySelectorAll('[data-action]');
    foreignElements.forEach(el => {
      el.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        const target = e.currentTarget as HTMLElement;
        const action = target.getAttribute('data-action');
        const nodeId = Number(target.getAttribute('data-id'));

        const findNode = (n: OrgNodeData): OrgNodeData | null => {
          if (n.id === nodeId) return n;
          if (n.children) {
            for (const c of n.children) {
              const res = findNode(c);
              if (res) return res;
            }
          }
          if (n._children) {
            for (const c of n._children) {
              const res = findNode(c);
              if (res) return res;
            }
          }
          return null;
        };

        const targetNode = findNode(orgTreeData);

        if ((action === 'click-to-edit' || action === 'edit-node') && targetNode) {
          handleOpenEditModal(targetNode, 'role-dept');
        } else if (action === 'permissions' && targetNode) {
          handleOpenEditModal(targetNode, 'permissions');
        } else if (action === 'toggle-collapse') {
          handleToggleCollapse(nodeId);
        }
      });
    });
  }, [orgTreeData, collapsedNodes, searchQuery, handleOpenEditModal, handleOpenPermissionModal, handleToggleCollapse, isAr]);

  // Zoom controls handlers
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.25);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 1000;
    const initialTransform = d3.zoomIdentity.translate(width / 2, 80).scale(0.85);
    d3.select(svgRef.current).transition().duration(450).call(zoomBehaviorRef.current.transform, initialTransform);
  };

  // Save All Changes (Role, Department, Permissions) directly to AppRepository & local state
  const handleSaveAll = () => {
    if (!activeConfigNode) return;

    const empToUpdate = employees.find(e => e.id === selectedEmployeeId);
    const targetDept = departments.find(d => d.id === editedDepartmentId);

    if (empToUpdate) {
      // 1. Update Employee role, job title, department assignment, and security clearance
      appRepository.updateEmployee(selectedEmployeeId, {
        jobTitleAr: editedJobTitleAr.trim() || empToUpdate.jobTitleAr,
        jobTitleEn: editedJobTitleEn.trim() || empToUpdate.jobTitleEn,
        isManager: editedIsManager,
        departmentId: editedDepartmentId,
        departmentNameAr: targetDept?.nameAr || empToUpdate.departmentNameAr,
        securityClearance: editedSecurityClearance
      });

      // 2. If designated as manager of target department, update department manager
      if (editedIsManager && targetDept) {
        appRepository.updateDepartment(editedDepartmentId, {
          managerId: selectedEmployeeId,
          managerNameAr: empToUpdate.fullNameAr
        });
      }
    }

    // 3. Update department/node permissions if modified
    if (editingPermissions) {
      setNodePermissions(prev => ({
        ...prev,
        [activeConfigNode.id]: { ...editingPermissions }
      }));
    }

    toast.success(
      isAr
        ? `تم تحديث وحفظ بيانات الموظف والمنصب والتبعية الإدارية بنجاح (${empToUpdate?.fullNameAr || activeConfigNode.nameAr})`
        : `Role, permissions, and department assignment updated successfully for ${empToUpdate?.fullNameEn || activeConfigNode.nameEn}`,
      {
        titleAr: 'تم الحفظ والاعتماد المباشر',
        titleEn: 'Changes Applied & Saved',
        corrNumber: activeConfigNode.code
      }
    );

    setIsModalOpen(false);
  };

  // Save Permissions Handler (fallback)
  const handleSavePermissions = () => {
    handleSaveAll();
  };

  // Restore baseline permissions for active node
  const handleRestoreDefaults = () => {
    if (!activeConfigNode) return;
    const defaultSet = DEFAULT_PERMISSIONS[activeConfigNode.id] || DEFAULT_PERMISSIONS[2];
    setEditingPermissions({ ...defaultSet });
    toast.info(
      isAr ? 'تمت استعادة الصلاحيات القياسية المعتمدة' : 'Standard baseline permissions restored',
      {
        titleAr: 'استعادة الضبط',
        titleEn: 'Reset Baseline',
        duration: 2000
      }
    );
  };

  // Add assigned employee role to node
  const handleAddRoleAssignment = () => {
    if (!activeConfigNode || !selectedRoleEmployee || !newRoleTitle.trim()) return;

    const matchedEmp = employees.find(e => String(e.id) === selectedRoleEmployee);
    if (!matchedEmp) return;

    const newRole = {
      roleId: `role-${Date.now()}`,
      roleNameAr: newRoleTitle.trim(),
      roleNameEn: newRoleTitle.trim(),
      employeeNameAr: matchedEmp.fullNameAr,
      employeeCode: matchedEmp.userCode
    };

    activeConfigNode.assignedRoles.push(newRole);
    setNewRoleTitle('');
    setSelectedRoleEmployee('');

    toast.success(
      isAr
        ? `تم تعيين وتفويض الدور (${newRole.roleNameAr}) للموظف ${matchedEmp.fullNameAr}`
        : `Role assigned successfully to ${matchedEmp.fullNameAr}`,
      {
        titleAr: 'تم تعيين الدور',
        titleEn: 'Role Assigned'
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Visualizer Header Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{isAr ? 'مخطط الهيكل التنظيمي التفاعلي (D3.js Org Visualizer)' : 'Interactive D3.js Org Tree Visualizer'}</span>
              <span className="text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold">
                SVG Engine 7.9
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تحريك، تقريب/تبعيد، طي التفرعات، وتعيين الصلاحيات والأدوار الإدارية لكل عقدة'
                : 'Pan, zoom, branch collapse, and direct role/permission assignment per node'}
            </p>
          </div>
        </div>

        {/* Action & Search Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Node Search Box */}
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'البحث عن إدارة أو مسؤول...' : 'Search node by title or manager...'}
              className="w-full pr-8 pl-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Zoom Buttons Group */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={isAr ? 'تكبير (+)' : 'Zoom In'}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={isAr ? 'تصغير (-)' : 'Zoom Out'}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title={isAr ? 'إعادة ضبط العرض' : 'Reset View'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* D3 Canvas Stage Container */}
      <div
        ref={containerRef}
        className="w-full h-[650px] bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-inner select-none cursor-grab active:cursor-grabbing"
      >
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.12] pointer-events-none"></div>

        {/* Floating Controls Tip Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 pointer-events-none shadow-xs">
          <Info className="w-3.5 h-3.5 text-indigo-500" />
          <span>{isAr ? 'انقر واسحب للتنقل • استخدم عجلة الماوس للتقريب • انقر على زر "الصلاحيات" لضبط صلاحيات الإدارة' : 'Drag to pan • Scroll to zoom • Click "Roles" to assign permissions'}</span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 right-4 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] mb-1">
            {isAr ? 'دلالات العقد الإدارية:' : 'Tree Legend:'}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-indigo-600"></span>
            <span>{isAr ? 'القيادة العليا (Apex CEO)' : 'Apex Leadership'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-white border border-slate-400"></span>
            <span>{isAr ? 'إدارة عامة رئيسية (Directorate)' : 'General Directorate'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded bg-slate-200 border border-slate-300"></span>
            <span>{isAr ? 'وحدة / قسم تشغيلي (Sub-unit)' : 'Affiliated Subunit'}</span>
          </div>
        </div>

        {/* Target SVG */}
        <svg ref={svgRef} className="w-full h-full block" />
      </div>

      {/* Role & Permission Assignment Modal / Drawer */}
      {isModalOpen && activeConfigNode && editingPermissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">
                      {activeConfigNode.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {activeConfigNode.nameAr}
                    </h3>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {isAr ? 'إدارة الأدوار الوظيفية، الصلاحيات الإجرائية، ودرجات التفويض' : 'Role assignment, procedural authority, and access matrix'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 px-4 pt-2 gap-1 text-xs">
              <button
                onClick={() => setActiveModalTab('role-dept')}
                className={`px-3 py-2 rounded-t-xl font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                  activeModalTab === 'role-dept'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isAr ? 'المنصب والتبعية الإدارية' : 'Role & Department'}</span>
              </button>

              <button
                onClick={() => setActiveModalTab('permissions')}
                className={`px-3 py-2 rounded-t-xl font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                  activeModalTab === 'permissions'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {Object.values(editingPermissions).filter(Boolean).length}
                </span>
              </button>

              <button
                onClick={() => setActiveModalTab('delegations')}
                className={`px-3 py-2 rounded-t-xl font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
                  activeModalTab === 'delegations'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-xs'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{isAr ? 'الأدوار والتفويضات' : 'Roles & Delegations'}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {activeConfigNode.assignedRoles.length}
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Department Overview Banner */}
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-xl border border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isAr ? 'الإدارة المعتمدة في الشجرة التنظيمية:' : 'Department in Hierarchy:'}</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{activeConfigNode.nameAr}</span>
                    <span className="text-[10px] text-slate-500 font-normal">({activeConfigNode.code})</span>
                  </div>
                </div>
                <div className="text-end font-mono">
                  <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2.5 py-1 rounded-lg font-bold border border-purple-200 dark:border-purple-800">
                    {activeConfigNode.securityClearance}
                  </span>
                </div>
              </div>

              {/* TAB 1: User Role, Title, and Department Assignment */}
              {activeModalTab === 'role-dept' && (
                <div className="space-y-5">
                  {/* Step 1: Employee Selector within this Department */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>{isAr ? 'اختيار الموظف المستهدف بالتعديل:' : 'Select Employee to Edit:'}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowTransferPicker(prev => !prev)}
                        className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>{showTransferPicker ? (isAr ? 'إخفاء البحث' : 'Hide Search') : (isAr ? 'نقل موظف من إدارة أخرى...' : 'Transfer from other dept...')}</span>
                      </button>
                    </div>

                    {/* Quick Transfer Employee Search Box */}
                    {showTransferPicker && (
                      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-2 animate-in fade-in">
                        <div className="text-[11px] font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نقل موظف من قسم آخر إلى هذه الإدارة:' : 'Select any employee to transfer to this department:'}</span>
                        </div>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            value={transferSearchQuery}
                            onChange={e => setTransferSearchQuery(e.target.value)}
                            placeholder={isAr ? 'بحث بالاسم أو الرقم الوظيفي...' : 'Search by name or code...'}
                            className="w-full pr-8 pl-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                          />
                        </div>
                        <div className="max-h-36 overflow-y-auto space-y-1">
                          {employees
                            .filter(
                              e =>
                                !transferSearchQuery.trim() ||
                                e.fullNameAr.toLowerCase().includes(transferSearchQuery.toLowerCase()) ||
                                e.userCode.toLowerCase().includes(transferSearchQuery.toLowerCase()) ||
                                e.departmentNameAr.toLowerCase().includes(transferSearchQuery.toLowerCase())
                            )
                            .map(emp => (
                              <button
                                key={emp.id}
                                type="button"
                                onClick={() => handleSelectEmployee(emp.id)}
                                className={`w-full p-2 rounded-lg text-start flex items-center justify-between text-xs transition cursor-pointer ${
                                  selectedEmployeeId === emp.id
                                    ? 'bg-indigo-600 text-white font-bold'
                                    : 'bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                <div className="space-y-0.5">
                                  <div className="font-semibold">{emp.fullNameAr} ({emp.userCode})</div>
                                  <div className={`text-[10px] ${selectedEmployeeId === emp.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                                    {emp.departmentNameAr} • {emp.jobTitleAr}
                                  </div>
                                </div>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/10">
                                  {emp.securityClearance}
                                </span>
                              </button>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Department Member Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {employees
                        .filter(e => {
                          const mappedDeptId = activeConfigNode.id > 100 ? Math.floor(activeConfigNode.id / 100) : activeConfigNode.id;
                          return e.departmentId === mappedDeptId;
                        })
                        .map(emp => {
                          const isSelected = selectedEmployeeId === emp.id;
                          return (
                            <div
                              key={emp.id}
                              onClick={() => handleSelectEmployee(emp.id)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/60 ring-2 ring-indigo-400/40'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-indigo-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-xs">
                                  {emp.fullNameAr.charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100 text-[11px] flex items-center gap-1.5">
                                    <span>{emp.fullNameAr}</span>
                                    {emp.isManager && (
                                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-1 rounded font-bold">
                                        {isAr ? 'مدير' : 'Mgr'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-500">{emp.jobTitleAr}</div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 text-indigo-600" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Step 2: Role, Title & Assignment Form */}
                  {selectedEmployeeId > 0 && (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-indigo-600" />
                          <span>{isAr ? 'تعديل بيانات المنصب والتبعية الإدارية للموظف:' : 'Employee Role & Department Form:'}</span>
                        </div>
                        {(() => {
                          const currentEmp = employees.find(e => e.id === selectedEmployeeId);
                          return (
                            <span className="font-mono text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold">
                              {currentEmp?.userCode}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Job Titles AR / EN */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {isAr ? 'المسمى والمنصب الوظيفي (بالعربية):' : 'Job Title (Arabic):'}
                          </label>
                          <input
                            type="text"
                            value={editedJobTitleAr}
                            onChange={e => setEditedJobTitleAr(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            placeholder={isAr ? 'مثال: مدير عام الشؤون القانونية' : 'e.g. General Director'}
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                            {isAr ? 'المسمى الوظيفي (بالإنجليزية):' : 'Job Title (English):'}
                          </label>
                          <input
                            type="text"
                            value={editedJobTitleEn}
                            onChange={e => setEditedJobTitleEn(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                            placeholder="e.g. General Director of Legal Affairs"
                          />
                        </div>
                      </div>

                      {/* Department Assignment Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                          <span>{isAr ? 'التبعية الإدارية المباشرة (الإدارة / القسم):' : 'Direct Department Assignment:'}</span>
                          <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                            {isAr ? 'تعديل التبعية ينقل الموظف فورياً' : 'Changing dept moves employee immediately'}
                          </span>
                        </label>
                        <select
                          value={editedDepartmentId}
                          onChange={e => setEditedDepartmentId(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold"
                        >
                          {departments.map(d => (
                            <option key={d.id} value={d.id}>
                              {d.nameAr} ({d.code})
                            </option>
                          ))}
                        </select>

                        {/* If department is being transferred */}
                        {(() => {
                          const currentEmp = employees.find(e => e.id === selectedEmployeeId);
                          const isTransferring = currentEmp && currentEmp.departmentId !== editedDepartmentId;
                          const targetDept = departments.find(d => d.id === editedDepartmentId);

                          if (isTransferring) {
                            return (
                              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>
                                  {isAr
                                    ? `نقل تنظيمي فوري: سيتم نقل الموظف من (${currentEmp.departmentNameAr}) إلى (${targetDept?.nameAr}) وتحديث قاعدة البيانات فور الحفظ.`
                                    : `Transfer notice: Employee will be reassigned from (${currentEmp.departmentNameAr}) to (${targetDept?.nameEn || targetDept?.nameAr}).`}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Manager Designation & Security Clearance */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {/* Appoint as Manager Toggle */}
                        <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition">
                          <div className="space-y-0.5 pr-2">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {isAr ? 'تعيين كمدير ورئيس معتمد' : 'Appoint as Dept Head'}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {isAr ? 'اعتماد التوقيع الرسمي وإشراف الإدارة' : 'Assign direct supervisory authority'}
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={editedIsManager}
                            onChange={e => setEditedIsManager(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                        </label>

                        {/* Security Clearance Dropdown */}
                        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-1">
                          <label className="text-[11px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5 text-purple-600" />
                            <span>{isAr ? 'التصنيف والتخليص الأمني:' : 'Security Clearance:'}</span>
                          </label>
                          <select
                            value={editedSecurityClearance}
                            onChange={e => setEditedSecurityClearance(Number(e.target.value) as SecurityLevel)}
                            className="w-full px-2 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                          >
                            <option value={SecurityLevel.Normal}>{isAr ? 'عادي (Normal)' : 'Normal'}</option>
                            <option value={SecurityLevel.Confidential}>{isAr ? 'سري (Confidential)' : 'Confidential'}</option>
                            <option value={SecurityLevel.TopConfidential}>{isAr ? 'سري للغاية (Top Confidential)' : 'Top Confidential'}</option>
                            <option value={SecurityLevel.Secret}>{isAr ? 'محظور / عالي الحساسية (Secret)' : 'Secret'}</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Granular Permissions Matrix */}
              {activeModalTab === 'permissions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>{isAr ? 'مصفوفة الصلاحيات الإجرائية الممنوحة للإدارة:' : 'Procedural Authority Toggles:'}</span>
                    </span>
                    <button
                      onClick={handleRestoreDefaults}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <ResetIcon className="w-3 h-3" />
                      <span>{isAr ? 'استعادة الضبط المعتمد' : 'Restore Baseline'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Permission 1: Register Incoming */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'قيد وتوزيع الوارد الخارجي' : 'Incoming Registration'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'تسجيل وقيد المعاملات الواردة وتوليد الباركود' : 'Register incoming and generate official barcodes'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canRegisterIncoming}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canRegisterIncoming: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    {/* Permission 2: Dispatch Outgoing */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'تصدير وإرسال الصادر الرسمي' : 'Official Outbox Dispatch'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'تصدير وتوجيه الخطابات للجهات الحكومية والخاصة' : 'Dispatch external letters to partner entities'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canDispatchOutgoing}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canDispatchOutgoing: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    {/* Permission 3: Digital Signatures */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'الاعتماد والتوقيع الرقمي (PKI)' : 'Digital Signature Sign-off'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'توقيع الوثائق بشهادة SHA-256 الحكومية' : 'Endorse documents with government PKI certificate'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canDigitalSign}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canDigitalSign: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    {/* Permission 4: Top Secret Access */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-purple-600" />
                          <span>{isAr ? 'الاطلاع على المعاملات السرية' : 'Confidential Access'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'فك تشفير ومطالعة المعاملات بمستوى سري وسري للغاية' : 'Decrypt Level 3 & Level 4 correspondence'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canAccessTopSecret}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canAccessTopSecret: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    {/* Permission 5: Multi Routing */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'الإحالة والتوجيه الإداري المتعدد' : 'Multi-Dept Routing'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'إحالة المعاملة إلى عدة إدارات ونسخ للإحاطة' : 'Forward to multiple departments and CC copies'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canRouteMulti}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canRouteMulti: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>

                    {/* Permission 6: Permanent Archiving */}
                    <label className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <div className="space-y-0.5 pr-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'الحفظ والأرشفة الإلكترونية الدائمة' : 'Permanent Archiving'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {isAr ? 'إيداع المعاملة في ملفات الحفظ وإغلاق القيد' : 'Deposit records to classified archive folders'}
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editingPermissions.canArchivePermanent}
                        onChange={e =>
                          setEditingPermissions(prev => prev && { ...prev, canArchivePermanent: e.target.checked })
                        }
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 3: Assigned Roles & Delegations */}
              {activeModalTab === 'delegations' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      <span>{isAr ? 'الأدوار الوظيفية والتفويضات المسندة:' : 'Assigned Departmental Roles:'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {activeConfigNode.assignedRoles.length} {isAr ? 'أدوار معتمدة' : 'roles'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {activeConfigNode.assignedRoles.map((role, idx) => (
                      <div
                        key={role.roleId}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{role.roleNameAr}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                              Active
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isAr ? 'الموظف المكلّف:' : 'Assigned:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{role.employeeNameAr}</span> ({role.employeeCode})
                          </div>
                        </div>

                        {idx > 0 && (
                          <button
                            onClick={() => {
                              activeConfigNode.assignedRoles = activeConfigNode.assignedRoles.filter(r => r.roleId !== role.roleId);
                              setEditingPermissions(prev => prev && { ...prev });
                              toast.info(isAr ? 'تم إلغاء التكليف' : 'Role unassigned');
                            }}
                            className="text-[10px] text-rose-600 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                          >
                            {isAr ? 'إلغاء الدور' : 'Remove'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Add new role form */}
                  <div className="p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'إسناد دور وصلاحية جديدة لموظف في هذه الإدارة:' : 'Assign New Role to Employee:'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newRoleTitle}
                        onChange={e => setNewRoleTitle(e.target.value)}
                        placeholder={isAr ? 'المسمى / الدور (مثال: مدقق نظامي أول)' : 'Role Title...'}
                        className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <select
                        value={selectedRoleEmployee}
                        onChange={e => setSelectedRoleEmployee(e.target.value)}
                        className="px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{isAr ? 'اختر موظفاً للتفويض...' : 'Select Employee...'}</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.fullNameAr} ({emp.jobTitleAr})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={handleAddRoleAssignment}
                      disabled={!newRoleTitle.trim() || !selectedRoleEmployee}
                      className="w-full py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer border border-indigo-200 dark:border-indigo-800"
                    >
                      {isAr ? '+ تأكيد إسناد الدور والتفويض' : '+ Confirm Role Assignment'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <div className="text-[11px] text-slate-500 hidden sm:block">
                {isAr ? 'يتم حفظ التغييرات واعتمادها فورياً في الهيكل الإداري' : 'Changes are updated live across the organization'}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>

                <button
                  onClick={handleSaveAll}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ واعتماد التعديلات' : 'Save & Enforce Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
