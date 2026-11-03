import { db } from "@/db"

export const generateCaddyFile = async () => {
    const projects = await db.query.projects.findMany()

    const caddyfile = `kinetic.sakshamjain.dev {
        reverse_proxy localhost:3000
    }` + projects.map((project) => {
        return `
${project.subdomain}.kinetic.sakshamjain.dev {
    reverse_proxy localhost:${project.port}
}
            `
    }).join("\n")

    return caddyfile
}