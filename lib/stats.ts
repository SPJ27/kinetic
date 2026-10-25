import { runCommand } from "./run-cmd"

const stats = async (projectId: string) => {
    const res = await runCommand("docker", ["stats", "--no-stream", "--format", "{{json .}}"], {cwd: process.cwd(), projectId, stage: "stats" } )



    
}