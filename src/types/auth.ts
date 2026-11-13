export type SystemRole = 'admin' | 'user';
export type AuthProvider = 'email' | 'google';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  authProvider: AuthProvider;
  roleId?: string;
  role: SystemRole;
  emailVerified: boolean;
  termsAccepted: boolean;
  termsAcceptedAt?: string | null;
  dataConsentAccepted?: boolean;
  dataConsentAcceptedAt?: string | null;
  allowPhotos?: boolean;
  allowAudio?: boolean;
  allowVideo?: boolean;
  consentVersion?: string;
  consentVerificationHash?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  authProvider: AuthProvider;
  role: SystemRole;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface ConsentEvidence {
  certificateId: string;
  verificationHash: string | null;
  consentVersion: string;
  generatedAt: string;
  participant: {
    id: string;
    name: string;
    email: string;
    institution: string;
  };
  study: {
    title: string;
    leadInvestigator: string;
    doctorateProgram: string;
    legalFramework: string;
  };
  status: {
    termsAccepted: boolean;
    termsAcceptedAt?: string | null;
    dataConsentAccepted?: boolean;
    dataConsentAcceptedAt?: string | null;
  };
  mediaPermissions: {
    photos: boolean;
    audio: boolean;
    video: boolean;
  };
}
