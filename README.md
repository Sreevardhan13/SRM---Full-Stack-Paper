# SRM BFHL Full Stack Challenge

Node.js REST API and single-page frontend for the SRM Full Stack Engineering Challenge.

## Run Locally

```bash
npm start
```

Open `http://localhost:3000`.

## API

`POST /bfhl`

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

The endpoint returns hierarchy objects, invalid entries, duplicate edges, and the summary required by the paper.

## Identity Fields

Set your real challenge credentials before hosting:

```bash
USER_ID=fullname_ddmmyyyy
EMAIL_ID=your.email@college.edu
COLLEGE_ROLL_NUMBER=YOUR_ROLL_NUMBER
```

On Windows PowerShell:

```powershell
$env:USER_ID="fullname_ddmmyyyy"
$env:EMAIL_ID="your.email@college.edu"
$env:COLLEGE_ROLL_NUMBER="YOUR_ROLL_NUMBER"
npm start
```

For Vercel, Render, Railway, or Netlify, add those three values as environment variables in the project settings.

## Test

```bash
npm test
```
