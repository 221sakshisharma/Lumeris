# Lumeris AI Learning Assistant - Backend

## Setup Requirements

1. **Python version**: Python 3.10+
2. **Virtual Environment**: Recommended to use `venv`.
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**: Create a `.env` file based on `.env.example` or set the variables in `app/core/config.py`:
   - `DATABASE_URL`: PostgreSQL connection string (Supabase)
   - `OPENROUTER_API_KEY`: OpenAI API key
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_KEY`: Supabase service role key

5. **Database Setup**: Execute the `schema.sql` file in your Supabase SQL Editor to set up the appropriate tables with `pgvector` support.

## Running the Application

From `backend/`:
```bash
uvicorn main:app --reload
```

From project root:
```bash
uvicorn backend.app.main:app --reload
```

## Architecture Layout

- `app/main.py`: Application entry point and router registration.
- `app/core/config.py`: Settings and environment config.
- `app/models/`: SQLAlchemy models mapping DB schema and Pydantic models for request/response validation.
- `app/routers/`: FastAPI route handlers (endpoints).
- `app/services/`: Core logic and integration with OpenAI and SentenceTransformers.
- `app/utils/`: Common helpers.
