export default function SignupPage() {
  
  return (
    <div className="flex flex-col m-8">
      <form className="flex flex-col gap-4" action="/api/users/signup" method="POST">
        <input name="username" type="text" placeholder="Username" required />
        <input name="email" type="email" placeholder="Email" required />
        <input name="password" type="password" placeholder="Password" required />
        <button className="border-1" type="submit">Sign Up</button>
      </form>
    </div>
  );
}
