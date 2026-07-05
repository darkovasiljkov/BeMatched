export interface Member {
  id: string
  dateOfBirth: string
  imageUrl?: string
  displayName: string
  createdOn: string
  lastActive: string
  gender: string
  description?: string
  city: string
  country: string
}

export interface Photo {
  id: number
  url: string
  publicId?: string
  memberId: string
}

export interface EditableMember {
  displayName: string;
  description?: string;
  city: string;
  country: string;
}