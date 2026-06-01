const fs = require('fs');

let auth = fs.readFileSync('restored/components/Auth.tsx', 'utf8');

// The original Auth takes onLogin(email, pwd) and onSignup(data)
// In our merged App.tsx, the onLogin/onSignup props are empty arrow functions:
// `<Auth onLogin={() => {}} onSignup={() => {}} />`
// Because `App.tsx`'s `useEffect` listens to Supabase auth events!
// So all we need is `Auth.tsx` to execute `supabase.auth.signInWithPassword` instead of `onLogin`!

// First, we need to add the import to supabase:
auth = `import { supabase } from '../services/supabaseClient';\n` + auth;

// Now let's inject a wrapper function or replace the `invoke` calls
const handleLoginPatch = `
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password || ''
        });
        if (error) throw error;
      } catch (err:any) {
        alert("Login failed: " + err.message);
      }
`;

const handleSignupPatch = `
      try {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.name
            }
          }
        });
        if (error) throw error;
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('users').update({
            mobile: formData.phone,
            sponsor_id: formData.referralCode || null
          }).eq('id', user.id);
        }
        alert('Registration successful! Check your email or try logging in.');
        setView('login');
      } catch (err:any) {
        alert("Signup failed: " + err.message);
      }
`;

// Replace `onLogin(formData.email, formData.password);` with patch
auth = auth.replace(/onLogin\(formData\.email,\s*formData\.password\);/g, handleLoginPatch);

// Replace `onSignup({...});` with patch
auth = auth.replace(/onSignup\({\s*\.\.\.formData,\s*referralCode:\s*finalReferralCode\s*}\);/g, handleSignupPatch);

// The `handleSubmit` was synchronous. We should make it async:
auth = auth.replace(/const handleSubmit = \(e: React\.FormEvent\) => {/, 'const handleSubmit = async (e: React.FormEvent) => {');

// Write it out
fs.writeFileSync('components/Auth.tsx', auth);
console.log('Migrated Auth.tsx');
