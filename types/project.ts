type Deployment = {
  id: string
  projectId: string
  status: string
  createdAt: Date
  commit: string | null     
  finishedAt: Date | null
}

type Project = {
  id: string
  name: string
  githubUrl: string
  subdomain: string
  userId: string
  status: string            
  createdAt: Date
  deployments: Deployment[]
}