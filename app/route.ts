export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const response = await fetch("http://158.220.108.252:4000/upload", {
      method: "POST",
      body: formData,
    });

    const text = await response.text();

    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    return Response.json(
      { error: "Upload proxy hatası" },
      { status: 500 }
    );
  }
}
