TRUMARG CHOICE-FILLING PLAN INTEGRATION

Copy these 3 files into your frontend project:

1) ChoiceFillingPlan.jsx
   -> frontend/src/components/ChoiceFillingPlan.jsx

2) choicePlanEngine.js
   -> frontend/src/components/choicePlanEngine.js

3) integrate-choice-plan.mjs
   -> frontend/integrate-choice-plan.mjs

Then from frontend:

node .\integrate-choice-plan.mjs
npm run build

The patch backs up:
src/pages/Results.jsx
to:
src/pages/Results.before-choice-plan-integration.jsx

Payment note:
The current website access model needs a dedicated Rs 999 entitlement.
Until backend/payment access returns choiceFillingPlan=true, choicePlan=true,
or planId='choice-plan', the new tab intentionally shows the locked plan.
