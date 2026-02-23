interface LoginPromptProps {
  onClose: () => void;
}

export function LoginPrompt({ onClose }: LoginPromptProps) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-foreground">Log in to continue</h3>
        <p className="text-sm text-muted-foreground">You need an account to post or reply.</p>
        <div className="flex gap-3">
          <a href="/login" className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90">Login</a>
          <a href="/signup" className="flex-1 text-center px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted">Sign Up</a>
        </div>
        <button onClick={onClose} className="w-full text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
    </div>
  );
}
