import { clerkMiddleware } from "@clerk/nextjs"; // O nome e o local corretos

// Esta é a função correta!
export default clerkMiddleware({
  // Dizer ao "guarda" que esta rota é PÚBLICA e não precisa de login
  // Isto permite que o Replicate nos envie a foto restaurada
  publicRoutes: ["/api/webhook"]
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};