
import { UserRole, User, Classification, DocStatus, DocumentMetadata } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', username: 'admin', role: UserRole.ADMIN, fullName: 'System Administrator' },
  { id: '2', username: 'manager', role: UserRole.MANAGER, fullName: 'Project Manager' },
  { id: '3', username: 'user', role: UserRole.USER, fullName: 'Standard User' },
  { id: '4', username: 'guest', role: UserRole.GUEST, fullName: 'External Guest' },
];

export const INITIAL_DOCS: DocumentMetadata[] = [
  {
    id: 'doc-1',
    name: 'Annual_Report_2023.pdf',
    type: 'application/pdf',
    classification: Classification.CONFIDENTIAL,
    status: DocStatus.ACTIVE,
    uploadedBy: '2',
    uploadedAt: '2023-12-01T10:00:00Z',
    reviewedBy: '1',
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
    uploadedBy: '3',
    uploadedAt: '2024-01-15T09:15:00Z',
    size: 450000,
    customerId: 'CUST-4412',
    description: 'Quarterly marketing objectives and budget allocation.',
    previewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop',
    version: 1,
    versions: [],
    expirationDate: '2024-06-30'
  },
  {
    id: 'doc-3',
    name: 'Security_Policy.pdf',
    type: 'application/pdf',
    classification: Classification.RESTRICTED,
    status: DocStatus.NEEDS_REVISION,
    uploadedBy: '1',
    uploadedAt: '2024-02-10T11:20:00Z',
    size: 1200000,
    customerId: 'ORG-CORE',
    description: 'Core organizational security protocols and response procedures.',
    comments: 'Missing section on biometric access controls.',
    version: 1,
    versions: [],
    expirationDate: '2025-01-01'
  }
];
