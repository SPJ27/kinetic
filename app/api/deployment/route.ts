import { runCommand } from "@/lib/run-cmd";

export async function GET(req: Request) {
    const logs = await runCommand('docker', ['logs', 'e898259087b2'], process.cwd(), false, {}, []);
    return new Response(JSON.stringify({ logs }), { status: 200 });
}