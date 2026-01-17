
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  GUEST = 'GUEST'
}

export enum DocStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING SOON',
  EXPIRED = 'EXPIRED',
  NEEDS_REVISION = 'NEEDS REVISION',
  REJECTED = 'REJECTED'
}

export enum Classification {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  RESTRICTED = 'RESTRICTED'
}

export interface PermissionSet {
  dashboard: boolean;
  documents: boolean;
  templates: boolean;
  admin: boolean;
}

export interface Role {
  id: string;
  name: string;
  permissions: PermissionSet;
}

export interface User {
  id: string;
  username: string;
  roleId: string; // References Role.id
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  lastLogin?: string;
}

export interface DocumentVersion {
  version: number;
  timestamp: string;
  updatedBy: string;
  userName: string;
  comment?: string;
  meta: Partial<DocumentMetadata>;
}

export interface DocumentMetadata {
  id: string;
  name: string;
  type: string;
  classification: Classification;
  status: DocStatus;
  uploadedBy: string; // User ID
  uploadedAt: string;
  reviewedBy?: string; // User ID
  reviewedAt?: string;
  size: number;
  description?: string;
  previewUrl?: string;
  customerId?: string;
  comments?: string;
  version: number;
  versions: DocumentVersion[];
  tags?: string[];
  expirationDate?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  defaultClassification: Classification;
  defaultTags: string[];
  defaultDescription: string;
  createdBy: string;
  createdAt: string;
}

export interface EventLog {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  action: 'UPLOAD' | 'UPDATE' | 'APPROVE' | 'REJECT' | 'REQUEST_REVISION' | 'ARCHIVE' | 'REVERT' | 'SUBMIT' | 'DELETE' | 'CREATE_USER' | 'UPDATE_ROLE';
  timestamp: string;
  comment?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
