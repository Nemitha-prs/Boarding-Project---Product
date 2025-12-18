# Signup Troubleshooting

If owner account creation is not working:

1. **Check if backend is running:**
   - Open terminal in `Backend` folder
   - Run `npm run dev`
   - Should see: "API listening on http://localhost:4000"

2. **Check browser console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages when clicking "Create owner account"

3. **Check Network tab:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try creating account again
   - Look for request to `http://localhost:4000/auth/register`
   - Check if it's failing (red) or successful (green)

4. **Common issues:**
   - Backend not running → Start backend server
   - CORS error → Backend should have CORS enabled (already configured)
   - Database connection error → Check Supabase credentials in Backend/.env
   - Port conflict → Change PORT in Backend/.env if 4000 is taken

5. **Test backend directly:**
   ```bash
   curl -X POST http://localhost:4000/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test123","role":"owner","name":"Test Owner","age":30,"phone":"0771234567","NIC":"123456789V"}'
   ```




