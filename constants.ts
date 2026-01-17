
import { UserRole, User, Classification, DocStatus, DocumentMetadata, Role } from './types';

export const INITIAL_ROLES: Role[] = [
  {
    id: 'role-admin',
    name: 'Administrator',
    permissions: { dashboard: true, documents: false, templates: false, admin: true }
  },
  {
    id: 'role-manager',
    name: 'Manager',
    permissions: { dashboard: true, documents: true, templates: true, admin: false }
  },
  {
    id: 'role-user',
    name: 'User',
    permissions: { dashboard: true, documents: true, templates: false, admin: false }
  },
  {
    id: 'role-guest',
    name: 'Guest',
    permissions: { dashboard: true, documents: true, templates: false, admin: false }
  }
];

export const MOCK_USERS: User[] = [
  { 
    id: 'admin1', 
    username: 'admin1', 
    roleId: 'role-admin', 
    firstName: 'Primary', 
    middleName: 'System',
    lastName: 'Admin', 
    fullName: 'Primary Admin', 
    email: 'admin1@docuvault.pro', 
    phone: '555-0101',
    accountStatus: 'ACTIVE'
  },
  { 
    id: 'admin2', 
    username: 'admin2', 
    roleId: 'role-admin', 
    firstName: 'Secondary', 
    middleName: 'Control',
    lastName: 'Admin', 
    fullName: 'Secondary Admin', 
    email: 'admin2@docuvault.pro', 
    phone: '555-0102',
    accountStatus: 'ACTIVE'
  },
  { 
    id: 'u2', 
    username: 'manager', 
    roleId: 'role-manager', 
    firstName: 'Sarah', 
    lastName: 'Manager', 
    fullName: 'Sarah Manager', 
    email: 'manager@docuvault.pro', 
    phone: '555-0201',
    accountStatus: 'ACTIVE'
  },
  { 
    id: 'u3', 
    username: 'user', 
    roleId: 'role-user', 
    firstName: 'David', 
    lastName: 'User', 
    fullName: 'David User', 
    email: 'user@docuvault.pro', 
    phone: '555-0301',
    accountStatus: 'ACTIVE'
  },
];

export const INITIAL_DOCS: DocumentMetadata[] = [
  {
    id: 'doc-1',
    name: 'Annual_Report_2023.pdf',
    type: 'application/pdf',
    classification: Classification.CONFIDENTIAL,
    status: DocStatus.ACTIVE,
    uploadedBy: 'u2',
    uploadedAt: '2023-12-01T10:00:00Z',
    reviewedBy: 'admin1',
    reviewedAt: '2023-12-05T14:30:00Z',
    size: 2450000,
    customerId: 'CUST-8821',
    description: 'Corporate annual financial results and strategy overview.',
    previewUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=400&auto=format&fit=crop',
    version: 1,
    versions: [],
    expirationDate: '2024-12-31'
  },
  {
    id: 'doc-2',
    name: 'Marketing_Plan_Q1.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    classification: Classification.INTERNAL,
    status: DocStatus.PENDING,
    uploadedBy: 'u3',
    uploadedAt: '2024-01-15T09:15:00Z',
    size: 450000,
    customerId: 'CUST-4412',
    description: 'Quarterly marketing objectives and budget allocation.',
    previewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop',
    version: 1,
    versions: [],
    expirationDate: '2024-06-30'
  },
];
