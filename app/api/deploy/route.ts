export async function POST(request: Request) {
  const { githubUrl, env } = await request.json();

  return new Response(JSON.stringify({ githubUrl, env }), { status: 200 });
  
}