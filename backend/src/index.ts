import { Hono } from 'hono'
import { createPrisma } from "./lib/prisma";
import { decode, sign, verify } from 'hono/jwt'

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
  return c.text("Backend running");
});

app.get("/api/v1/users", async (c) => {
  const prisma = createPrisma(c.env.DATABASE_URL);

  const users = await prisma.user.findMany();

  return c.json(users);
});

// Sign up route
app.post('/api/v1/signup', async(c) => {
  const prisma = createPrisma(c.env.DATABASE_URL);
  const body = await c.req.json();

  const user = await prisma.user.create({
    data:{
      email: body.email,
      password: body.password
    },
  })

  const token = await sign({
    id: user.id},
    c.env.JWT_SECRET
  )

  return c.json({
    msg: 'User signed up successfully',
    token
  })
    
})

// Login Route
app.post('/api/v1/login', async(c) => {
 // Initialize Prisma client
  const prisma = createPrisma(c.env.DATABASE_URL);

  // Get the body from the incoming json
  const body = await c.req.json()

  // try to find the user in the db
  const user = await prisma.user.findUnique({
    where: {
      email: body.email,
      password: body.password
    }
  })

  // if no user is found tell not found
  if(!user){
    c.status(403);
    return c.json({ error: "User not found "});
  }

  // if wrong password is entered throw error
  if(user.password !== body.password){
    c.status(401);
    return c.json({
      error: "Invalid Password"
    });
  }

  // create a jwt for them
  const jwt = await sign({
      id: user.id
    }, 
      c.env.JWT_SECRET
    )
  
  // message which says logged in
  return c.json({ 
    msg: "Logged in Successfully",
    jwt 
  });
}); 

/* 
app.post('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.put('/api/v1/blog', (c) => {
  return c.text('Hello Hono!')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('Hello Hono!')
}) */

export default app
