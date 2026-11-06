# Income Flow

Build a clean, modern web app using React, Tailwind CSS, and Shadcn UI to track income with flexible scheduling. The app must allow users to:

1. Input Income: Enter an amount, a source name, and a "Start Date."

2. Distribution Logic: By default, income counts toward the month of the Start Date. However, provide a "Split Across Months" toggle.

• If toggled, allow the user to select a duration (e.g., 3 months, 12 months).

• The app should automatically divide the total amount equally across those consecutive months.

3. Dashboard Views:

• Monthly View: A bar chart and a list showing total earned per month.

• Yearly View: A high-level summary of total annual earnings.

• Transaction Log: A table of all entries with the ability to edit or delete.

Visual Style:

• Use a minimalist "Fintech" aesthetic (light mode by default with soft grays and indigo accents).

• Incorporate Lucide-react icons for income and calendar actions.

• Ensure the dashboard uses Recharts for a visual representation of income trends.

Technical Constraint:

• Manage state locally for now (localStorage) so data persists on refresh.

• Ensure the "Income Split" logic correctly handles year-end rollovers (e.g., a 3-month split starting in December should show in Dec, Jan, and Feb).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://maxtracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ce550a2-d880-4976-b494-3aae0b664bcb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
