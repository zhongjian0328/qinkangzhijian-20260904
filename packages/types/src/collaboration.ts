export interface CollabMember {
  userId: string;
  name: string;
  role: string;
}

export interface Collaboration {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  topic?: string | null;
  members: CollabMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CollabMessage {
  id: string;
  collaborationId: string;
  userId: string;
  type: string; // text | file
  content: string;
  fileUrl?: string | null;
  createdAt: string;
  userName?: string;
}

export interface CreateCollaborationInput {
  name: string;
  description?: string;
  topic?: string;
  members?: CollabMember[];
}

export interface CreateCollabMessageInput {
  type?: string;
  content: string;
  fileUrl?: string;
}
