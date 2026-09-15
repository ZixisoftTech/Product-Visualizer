# Rajgarhwala AI Furniture Visualizer (MVP)

> **Visualize furniture in your customer's actual room.**  
> A high-fidelity, room-preserving AI application designed for furniture showroom salespeople.

---

## 1. Overview & Core Philosophy

Showroom salespeople photograph a customer's real room and a showroom furniture piece, input real dimensions, select placement, and provide natural language placement instructions.

The system uses OpenAI's multimodal vision and photorealistic image generation to naturally place the showroom piece into the customer's actual room while **strictly preserving the customer's actual room** (flooring, walls, doors, windows, and existing room fixtures) and **stripping away all showroom background clutter** (showroom floor tiles, price tags, neighboring displays, shoppers).

---

## 2. Technology Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, React, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js Server-Side Route Handlers (`/api/visualize`, `/api/visualize/[id]/regenerate`).
- **Database**: MySQL with Prisma ORM (`visualizations` table).
- **Image Processing**: Sharp (format validation, EXIF normalization, metadata extraction, optimization).
- **AI Engine**: OpenAI GPT-4o Multimodal Vision + DALL-E 3 Photorealistic Generation.
- **Validation**: Zod schema validation for dimensions, placements, and file payloads.
- **Storage**: Safe local filesystem storage in `public/uploads/{halls,products,generated}/`.

---

## 3. Project Structure

```text
app/
  api/
    visualize/
      route.ts                     # Generation & retrieval API route
      [id]/regenerate/
        route.ts                   # Regeneration API route
  globals.css                      # Global styles & scrollbars
  layout.tsx                       # Root layout & viewport metadata
  page.tsx                         # Main showroom visualizer workflow

components/
  DimensionForm.tsx                # Width, depth, height & unit controls
  GenerateButton.tsx               # Action trigger with live requirement checks
  HallUpload.tsx                   # Customer room photo/camera upload
  Header.tsx                       # Showroom branding header
  InstructionInput.tsx             # Natural language placement prompt
  PlacementSelector.tsx            # Placement radio pills (Center, Back Wall, etc.)
  ProcessingState.tsx              # Multi-step progress modal
  ProductUpload.tsx                # Showroom piece upload with clutter isolation notice
  ResultViewer.tsx                 # Interactive Before/After slider & side-by-side mode

lib/
  ai/
    analyzeProduct.ts              # GPT-4o vision isolation of showroom piece
    analyzeRoom.ts                 # GPT-4o vision room architectural analysis
    config.ts                      # Centralized OpenAI model & resolution config
    generateVisualization.ts       # Core orchestrator pipeline
    isolateProduct.ts              # Furniture isolation specification
    prompts.ts                     # Room-preservation prompt engine
    types.ts                       # AI TypeScript types
  db/
    prisma.ts                      # Prisma client singleton
  image/
    process.ts                     # Sharp optimization & thumbnailing
    storage.ts                     # Local storage with path traversal protection
    validate.ts                    # Sharp buffer validation & MIME checks
  validation/
    visualization.ts               # Zod validation schemas

prisma/
  schema.prisma                    # MySQL database schema

public/
  uploads/
    generated/                     # Generated visual outputs
    halls/                         # Preserved original room photos
    products/                      # Preserved showroom furniture photos
    thumbnails/                    # Lightweight previews

tests/
  suite.ts                         # Automated validation & unit test suite (26 tests)
  e2e-api.ts                       # End-to-end integration test runner
```

---

## 4. Environment Variables

Create `.env.local` or `.env` in the project root:

```env
# OpenAI API Key (required for real GPT-4o vision analysis & photorealistic image generation)
OPENAI_API_KEY="sk-..."

# MySQL Database Connection String via Prisma
DATABASE_URL="mysql://root:@localhost:3306/rajgarhwala_visualizer"

# Upload storage directory relative to project root
UPLOAD_DIR="public/uploads"
```

---

## 5. Database Setup (MySQL)

1. Start your local MySQL service (e.g. `brew services start mysql`).
2. Create the database:
   ```bash
   mysql -u root -e "CREATE DATABASE IF NOT EXISTS rajgarhwala_visualizer;"
   ```
3. Push the Prisma schema and generate client:
   ```bash
   npm run prisma:push
   ```

---

## 6. How to Run Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser or mobile viewport.
3. **Run production build**:
   ```bash
   npm run build
   npm start
   ```

---

## 7. AI Workflow Explanation

1. **Customer Room Analysis (`analyzeRoom.ts`)**:
   GPT-4o vision inspects the customer's room photograph to capture wall finishes, flooring textures, natural/artificial lighting angles, and room geometry.
2. **Product Isolation & Background Stripping (`analyzeProduct.ts` & `isolateProduct.ts`)**:
   GPT-4o vision isolates the showroom piece, identifying its exact materials, color tones, cushions, armrests, stitching, and legs, while discarding showroom floor tiles, price tags, and other displays.
3. **Prompt Synthesis (`prompts.ts`)**:
   Synthesizes strict room preservation mandates, physical dimension scaling, placement coordinates, and realistic contact shadows.
4. **Photorealistic Generation (`generateVisualization.ts`)**:
   Generates the final image with OpenAI (DALL-E 3), saves it to `public/uploads/generated/`, and marks the record `COMPLETED`.
5. **Regeneration Flow**:
   Salespeople can click "Adjust Placement" to reposition or modify instructions without re-uploading photographs.

---

## 8. Test Suite Results

Run automated tests:
```bash
# Unit & validation tests
npx tsx tests/suite.ts

# Full end-to-end pipeline test
npx tsx tests/e2e-api.ts
```

- **Sharp image validation**: Corrupt images, non-images (`.exe`, `.pdf`, `.txt`), and empty files rejected. Valid JPEGs, PNGs, and WebPs parsed with correct metadata.
- **Zod form validation**: Negative, non-numeric, and 0 dimensions rejected. Invalid units rejected.
- **Local storage security**: Safe UUID filenames, path traversal attacks (`../../../../etc/passwd`) blocked.
- **MySQL & Prisma**: Creation, status updates (`PENDING` → `PROCESSING` → `COMPLETED`), and retrieval verified.
- **AI preservation rules**: Strict room preservation, product identity, and showroom clutter removal verified in prompt synthesis.
- **Result**: **26 of 26 tests passed with 0 errors**.

---

## 9. Known Limitations & Recommended Next Steps

### Known Limitations
- Current image generation model (DALL-E 3) generates full scene renderings based on detailed vision prompts. Architectural dimensions serve as strong visual scale guidance rather than CAD-level millimeter tolerance.

### Recommended Next Improvements
- Direct image-to-image inpainting mask editor for interactive drag-and-drop placement bounding boxes.
- Direct WhatsApp sharing link generation for instant quotation sharing with customers.
- Offline showroom product catalog integration for one-tap product selection.
