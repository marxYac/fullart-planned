import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center relative px-4 py-12">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 pointer-events-none bg-noise opacity-30 z-[-1]" />
      <div className="fixed top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-brand/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block text-4xl font-bold tracking-tighter text-brand hover:scale-105 transition-transform mb-4">
            FULLART
          </Link>
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6">
            <Sparkles className="w-3 h-3" />
            Nuovo Percorso
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Unisciti a noi.</h2>
          <p className="text-muted text-sm mt-2">
            Crea il tuo profilo per accedere a rituali personalizzati e prenotazioni prioritarie.
          </p>
        </div>

        {/* Clerk SignUp component with Premium Styling */}
        <div className="flex w-full justify-center 
          [&_.cl-rootBox]:w-full 
          [&_.cl-cardBox]:w-full 
          [&_.cl-card]:w-full 
          [&_.cl-card]:max-w-full 
          [&_.cl-card]:bg-white/70
          [&_.cl-card]:backdrop-blur-xl
          [&_.cl-card]:border
          [&_.cl-card]:border-brand/10
          [&_.cl-card]:rounded-[2.5rem]
          [&_.cl-card]:shadow-2xl
          [&_.cl-card]:shadow-brand/5
          [&_.cl-headerTitle]:text-foreground
          [&_.cl-headerTitle]:font-bold
          [&_.cl-headerTitle]:tracking-tight
          [&_.cl-headerSubtitle]:text-muted
          [&_.cl-formButtonPrimary]:bg-brand
          [&_.cl-formButtonPrimary]:hover:bg-brand-hover
          [&_.cl-formButtonPrimary]:text-white
          [&_.cl-formButtonPrimary]:rounded-2xl
          [&_.cl-formButtonPrimary]:h-12
          [&_.cl-formButtonPrimary]:font-bold
          [&_.cl-formButtonPrimary]:shadow-lg
          [&_.cl-formButtonPrimary]:shadow-brand/20
          [&_.cl-formFieldInput]:bg-white/50
          [&_.cl-formFieldInput]:border-brand/10
          [&_.cl-formFieldInput]:rounded-xl
          [&_.cl-formFieldInput:focus]:border-brand
          [&_.cl-formFieldInput:focus]:ring-brand/20
          [&_.cl-footerActionLink]:text-brand
          [&_.cl-footerActionLink]:font-bold
          [&_.cl-socialButtonsBlockButton]:border-brand/10
          [&_.cl-socialButtonsBlockButton]:rounded-xl
          [&_.cl-socialButtonsBlockButton]:bg-white/50
          [&_.cl-socialButtonsBlockButtonText]:font-medium
          [&_.cl-identityPreviewText]:text-foreground
          [&_.cl-internal-b3fm6y]:hidden"
        >
          <SignUp />
        </div>
      </div>
    </div>
  );
}
