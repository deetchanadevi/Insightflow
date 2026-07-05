/**
 * PredictIQ - Application Logic Engine
 * Implements client-side predictive time-series math (OLS Linear Regression + Seasonality),
 * CSV uploading and mapping, dynamic AI recommendations, and interactive Chart.js handlers.
 */

// ==========================================================================
// 1. Core State Configuration & Industry Data Models
// ==========================================================================

const INDUSTRY_PROFILES = {
    retail: {
        name: "Retail & Commerce",
        modules: {
            demand: {
                title: "Demand Forecasting",
                subtitle: "Predicting incoming monthly orders and sales volumes.",
                unit: " orders",
                kpiCaption: "Projected peak next quarter",
                historical: [12000, 11500, 13100, 14200, 13800, 15500, 16200, 15900, 17500],
                // Seasonal indices: Dec, Nov are peak, Jan, Feb are low
                seasonality: [0.95, 0.90, 1.02, 1.05, 1.03, 1.10, 1.12, 1.08, 1.15, 1.18, 1.35, 1.45], // Jan-Dec multipliers
                insightTemplate: "Demand is projected to peak at {PEAK} in Dec due to holiday shopping. Consider pre-ordering inventory buffer of {BUFFER} units by late October to avoid stockouts."
            },
            inventory: {
                title: "Inventory Forecasting",
                subtitle: "Optimizing safety stock levels and reorder thresholds.",
                unit: " items",
                kpiCaption: "Recommended safety buffer",
                historical: [45000, 43000, 42100, 46000, 47200, 49000, 51000, 50200, 53000],
                seasonality: [0.94, 0.92, 0.98, 1.00, 1.02, 1.04, 1.05, 1.03, 1.08, 1.10, 1.25, 1.30],
                insightTemplate: "Safety stock needs will expand to {PEAK} units in December. We recommend increasing local warehousing capacity by 15% and triggering purchase orders 12 days earlier."
            },
            staffing: {
                title: "Staffing Forecasting",
                subtitle: "Scheduling optimal retail store roster sizes.",
                unit: " FTEs",
                kpiCaption: "Target shift roster capacity",
                historical: [42, 40, 44, 45, 45, 48, 50, 49, 52],
                seasonality: [0.95, 0.92, 0.98, 1.00, 1.00, 1.05, 1.08, 1.05, 1.10, 1.15, 1.30, 1.40],
                insightTemplate: "Staffing requirements will rise to {PEAK} FTEs during the peak winter holiday rush. Plan contract worker onboarding by early November to allow adequate training."
            },
            revenue: {
                title: "Revenue Forecasting",
                subtitle: "Estimating future sales cash inflows.",
                unit: " USD",
                kpiCaption: "Projected monthly recurring sales",
                historical: [240000, 231000, 262000, 284000, 276000, 310000, 324000, 318000, 350000],
                seasonality: [0.95, 0.90, 1.02, 1.05, 1.03, 1.10, 1.12, 1.08, 1.15, 1.18, 1.35, 1.45],
                insightTemplate: "Quarterly revenue is on an upward trajectory, estimated to hit {PEAK} in Dec. Margins are stable; allocate surplus cash to inventory prepayments."
            }
        }
    },
    restaurant: {
        name: "Restaurants & Hospitality",
        modules: {
            demand: {
                title: "Diner Demand Forecasting",
                subtitle: "Predicting weekly/monthly table covers and reservations.",
                unit: " guests",
                kpiCaption: "Projected peak guest count",
                historical: [8200, 7900, 8500, 9100, 10200, 11500, 12100, 12400, 10500],
                // Peak in Summer (Jun-Aug), low in Jan-Feb
                seasonality: [0.82, 0.80, 0.90, 0.98, 1.10, 1.25, 1.30, 1.32, 1.05, 0.98, 1.05, 1.15],
                insightTemplate: "Diner traffic exhibits strong summer seasonality. Expect guest counts to hit {PEAK} next season. Plan patio seating extensions and special seasonal menu purchasing."
            },
            inventory: {
                title: "Ingredient Inventory Forecasting",
                subtitle: "Preventing kitchen raw ingredient waste and spoilage.",
                unit: " USD",
                kpiCaption: "Recommended ingredient buffer value",
                historical: [28000, 27500, 29000, 30500, 33000, 36000, 37200, 37500, 33200],
                seasonality: [0.85, 0.82, 0.92, 0.96, 1.08, 1.20, 1.25, 1.26, 1.05, 0.98, 1.04, 1.12],
                insightTemplate: "Required food & beverage inventory values are forecasted to reach {PEAK}. Set up standing vendor deliveries with a safety margin of {BUFFER} to prevent stockouts of critical fresh ingredients."
            },
            staffing: {
                title: "Kitchen & FOH Staffing",
                subtitle: "Determining cook and server shift headcounts.",
                unit: " staff",
                kpiCaption: "Peak roster headcount",
                historical: [24, 22, 25, 26, 29, 32, 34, 34, 29],
                seasonality: [0.84, 0.80, 0.88, 0.94, 1.06, 1.20, 1.24, 1.24, 1.02, 0.94, 1.02, 1.10],
                insightTemplate: "Optimal server and kitchen staff rosters will scale to {PEAK} active personnel. Dynamic scheduling is recommended during weekends to keep labor costs within 28% of sales."
            },
            revenue: {
                title: "Gross Restaurant Revenue",
                subtitle: "Predicting monthly billings and catering receipts.",
                unit: " USD",
                kpiCaption: "Projected monthly receipts",
                historical: [164000, 158000, 170000, 182000, 204000, 230000, 242000, 248000, 210000],
                seasonality: [0.82, 0.80, 0.90, 0.98, 1.10, 1.25, 1.30, 1.32, 1.05, 0.98, 1.05, 1.15],
                insightTemplate: "Table revenue is expected to grow, pacing towards {PEAK}. Consider loyalty programs during the Q1 low season to smooth out revenue dips."
            }
        }
    },
    healthcare: {
        name: "Healthcare Providers",
        modules: {
            demand: {
                title: "Patient Admissions",
                subtitle: "ER admission volumes and outpatient appointments.",
                unit: " patients",
                kpiCaption: "Projected peak ER admissions",
                historical: [3200, 3100, 3250, 3110, 2950, 2800, 2750, 2900, 3150],
                // Peak in Winter (Dec-Feb) due to virus seasons
                seasonality: [1.18, 1.15, 1.05, 0.98, 0.92, 0.88, 0.86, 0.90, 0.98, 1.04, 1.12, 1.22],
                insightTemplate: "Admissions are anticipated to peak at {PEAK} patients in December/January due to respiratory viral seasons. Prepare isolation ward capacities and coordinate with local clinics."
            },
            inventory: {
                title: "Medical Supplies Optimization",
                subtitle: "Stocking levels for PPE, ICU medications, and diagnostic kits.",
                unit: " units",
                kpiCaption: "Recommended supply reserves",
                historical: [84000, 82000, 85000, 81000, 78000, 75000, 74000, 77000, 83000],
                seasonality: [1.16, 1.14, 1.06, 0.99, 0.94, 0.90, 0.88, 0.92, 0.99, 1.05, 1.11, 1.20],
                insightTemplate: "Medical supply demand will peak at {PEAK} items. We recommend securing a safety buffer of {BUFFER} ICU/PPE items to withstand supplier delivery delays."
            },
            staffing: {
                title: "Nurse & Doctor Roster",
                subtitle: "Calculating ward staffing indices to control wait times.",
                unit: " staff",
                kpiCaption: "Optimal shift headcount",
                historical: [110, 108, 112, 106, 102, 98, 96, 100, 108],
                seasonality: [1.15, 1.12, 1.06, 0.99, 0.95, 0.92, 0.90, 0.94, 0.99, 1.04, 1.09, 1.18],
                insightTemplate: "Required staffing rosters will expand to {PEAK} nurses and physicians during the winter peak. Leverage float pools and on-call rotations to maintain triage ratios."
            },
            revenue: {
                title: "Insurance & Patient Billings",
                subtitle: "Predicting monthly claims and healthcare service revenues.",
                unit: " USD",
                kpiCaption: "Projected billing collections",
                historical: [1120000, 1085000, 1137000, 1088000, 1032500, 980000, 962500, 1015000, 1102000],
                seasonality: [1.18, 1.15, 1.05, 0.98, 0.92, 0.88, 0.86, 0.90, 0.98, 1.04, 1.12, 1.22],
                insightTemplate: "Cash inflows will peak at {PEAK} in Dec. Deductibles and annual resets will impact Q1 collections; review accounts receivable lag parameters."
            }
        }
    },
    manufacturing: {
        name: "Smart Manufacturing",
        modules: {
            demand: {
                title: "Factory Output Demand",
                subtitle: "Predicting raw buyer contracts and shipment requirements.",
                unit: " units",
                kpiCaption: "Peak factory output forecast",
                historical: [24000, 24500, 25200, 23800, 25600, 26100, 26800, 24200, 27500],
                // Maintenance dip in Aug/Dec
                seasonality: [1.02, 1.03, 1.05, 1.02, 1.04, 1.06, 1.08, 0.92, 1.07, 1.08, 1.05, 0.88],
                insightTemplate: "Output demand is projected to reach {PEAK} units in October. Plan maintenance schedules during the seasonal August/December dips to avoid line bottlenecks."
            },
            inventory: {
                title: "Raw Materials Stockpile",
                subtitle: "Forecasting steel, polymer, or copper supply stockpiles.",
                unit: " tons",
                kpiCaption: "Target raw material reserves",
                historical: [340, 345, 355, 338, 360, 365, 375, 330, 385],
                seasonality: [1.02, 1.03, 1.05, 1.02, 1.04, 1.06, 1.08, 0.92, 1.07, 1.08, 1.05, 0.88],
                insightTemplate: "Raw material stockpiles should hold a minimum of {BUFFER} tons as safety buffer. Supplier lead times are expected to extend by 4 days in Q4; trigger reorders earlier."
            },
            staffing: {
                title: "Floor Operator Shifts",
                subtitle: "Predicting operators needed for assembly and QC lines.",
                unit: " operators",
                kpiCaption: "Peak operator roster count",
                historical: [80, 81, 83, 80, 84, 85, 87, 75, 89],
                seasonality: [1.01, 1.02, 1.04, 1.01, 1.03, 1.05, 1.06, 0.90, 1.05, 1.06, 1.04, 0.89],
                insightTemplate: "Assembly shift personnel count should scale to {PEAK} operators in October. Maintain 3-shift schedules to meet contract delivery commitments."
            },
            revenue: {
                title: "Shipment Contract Revenue",
                subtitle: "Predicting cash flow from completed supplier contracts.",
                unit: " USD",
                kpiCaption: "Projected monthly contract billings",
                historical: [720000, 735000, 756000, 714000, 768000, 783000, 804000, 726000, 825000],
                seasonality: [1.02, 1.03, 1.05, 1.02, 1.04, 1.06, 1.08, 0.92, 1.07, 1.08, 1.05, 0.88],
                insightTemplate: "Contract revenue is steady and pacing toward {PEAK}. Account for the Q4 factory maintenance dip to maintain cash flow covenants."
            }
        }
    },
    education: {
        name: "Higher Education",
        modules: {
            demand: {
                title: "Enrollment & Applications",
                subtitle: "Predicting freshman and online enrollment registrations.",
                unit: " students",
                kpiCaption: "Peak enrollment applications",
                historical: [1500, 1900, 2400, 3100, 1800, 1200, 800, 2800, 3500],
                // Dual peaks: Sep (start of year) and Jan (spring term)
                seasonality: [1.20, 0.95, 0.85, 0.70, 0.60, 0.50, 0.40, 1.50, 1.95, 1.10, 0.90, 1.15],
                insightTemplate: "Applications will peak dramatically at {PEAK} in September. We suggest deploying automated screening tools to handle the high document intake volume."
            },
            inventory: {
                title: "Campus Housing Occupancy",
                subtitle: "Forecasting dormitory and dining hall capacity loads.",
                unit: " dorms occupied",
                kpiCaption: "Peak housing capacity forecast",
                historical: [4200, 4100, 4000, 3800, 2200, 1200, 1000, 4500, 4800],
                seasonality: [1.15, 1.12, 1.10, 1.05, 0.60, 0.30, 0.25, 1.20, 1.30, 1.25, 1.22, 1.20],
                insightTemplate: "Dormitory housing will hit a peak demand of {PEAK} rooms in September. Summer occupancy drops to 25%; leverage summer conferences to monetize vacant housing."
            },
            staffing: {
                title: "Faculty & Advisor Roster",
                subtitle: "Determining adjunct professors and administrative support.",
                unit: " instructors",
                kpiCaption: "Active teaching staff headcount",
                historical: [180, 175, 170, 160, 110, 80, 70, 190, 210],
                seasonality: [1.14, 1.11, 1.08, 1.02, 0.70, 0.50, 0.45, 1.20, 1.30, 1.26, 1.24, 1.20],
                insightTemplate: "Active academic faculty requirements will peak at {PEAK} instructors. Standardize the onboarding of graduate teaching assistants by mid-summer to prepare."
            },
            revenue: {
                title: "Tuition & Endowment Inflow",
                subtitle: "Predicting semester tuition billings and alumni donations.",
                unit: " USD",
                kpiCaption: "Projected peak monthly cash intake",
                historical: [1500000, 800000, 600000, 450000, 400000, 350000, 300000, 2200000, 3800000],
                seasonality: [1.20, 0.95, 0.85, 0.70, 0.60, 0.50, 0.40, 1.50, 1.95, 1.10, 0.90, 1.15],
                insightTemplate: "Tuition collection will surge to {PEAK} in September. Secure short-term credit facility draws in June/July to bridge the seasonal summer cash dip."
            }
        }
    },
    marketing: {
        name: "Digital Marketing",
        modules: {
            demand: {
                title: "Ad Campaign Leads",
                subtitle: "Forecasting click-through acquisitions and landing page conversions.",
                unit: " leads",
                kpiCaption: "Projected monthly lead count",
                historical: [15000, 16200, 17500, 18100, 17200, 19000, 19500, 18500, 22000],
                seasonality: [0.94, 0.92, 1.04, 1.02, 0.98, 1.05, 1.06, 0.95, 1.12, 1.18, 1.30, 1.25],
                insightTemplate: "Inbound leads are forecasted to peak at {PEAK} in November during holiday promos. Allocate retargeting budget of {BUFFER} by early October to maximize ROAS."
            },
            inventory: {
                title: "Ad Spend Budget Reserves",
                subtitle: "Predicting optimal bidding budgets to avoid overbidding.",
                unit: " USD",
                kpiCaption: "Recommended monthly budget buffer",
                historical: [30000, 32400, 35000, 36200, 34400, 38000, 39000, 37000, 44000],
                seasonality: [0.94, 0.92, 1.04, 1.02, 0.98, 1.05, 1.06, 0.95, 1.12, 1.18, 1.30, 1.25],
                insightTemplate: "Ad spend budgets will scale to {PEAK} in November. Monitor CPA metrics closely to detect search ad bidding saturation and adjust bids daily."
            },
            staffing: {
                title: "Agency Account Managers",
                subtitle: "Predicting account managers needed to handle client ad accounts.",
                unit: " managers",
                kpiCaption: "Optimal manager headcount",
                historical: [12, 12, 13, 14, 14, 15, 15, 14, 16],
                seasonality: [0.95, 0.93, 1.01, 1.01, 0.99, 1.03, 1.04, 0.97, 1.08, 1.12, 1.20, 1.18],
                insightTemplate: "Client accounts load requires hiring up to {PEAK} active managers. Consider onboarding freelancers in October to buffer the heavy Q4 marketing load."
            },
            revenue: {
                title: "Customer Lifetime Value (LTV)",
                subtitle: "Predicting recurring contract values and affiliate returns.",
                unit: " USD",
                kpiCaption: "Projected monthly client returns",
                historical: [180000, 194400, 210000, 217200, 206400, 228000, 234000, 222000, 264000],
                seasonality: [0.94, 0.92, 1.04, 1.02, 0.98, 1.05, 1.06, 0.95, 1.12, 1.18, 1.30, 1.25],
                insightTemplate: "LTV-driven revenue is pacing towards {PEAK}. Standard cohort churn analysis shows strong Q4 user retention; focus upsell programs on SaaS buyers."
            }
        }
    },
    finance: {
        name: "Finance & SaaS",
        modules: {
            demand: {
                title: "Subscriber Signups",
                subtitle: "Predicting inbound platform customer signups.",
                unit: " accounts",
                kpiCaption: "Projected monthly account signups",
                historical: [1800, 1950, 2100, 2200, 2150, 2300, 2400, 2350, 2550],
                seasonality: [0.96, 0.94, 1.02, 1.01, 0.98, 1.04, 1.05, 0.97, 1.08, 1.10, 1.15, 1.12],
                insightTemplate: "New customer acquisition is on track to hit {PEAK} accounts in Nov. Scaling onboarding automation is recommended to support high concurrent logins."
            },
            inventory: {
                title: "API Cloud Reservations",
                subtitle: "Forecasting CPU/GPU server reservations to maintain SLA.",
                unit: " instances",
                kpiCaption: "Target container instance reservations",
                historical: [120, 130, 140, 148, 144, 155, 160, 156, 170],
                seasonality: [0.96, 0.94, 1.02, 1.01, 0.98, 1.04, 1.05, 0.97, 1.08, 1.10, 1.15, 1.12],
                insightTemplate: "Cloud resource consumption is pacing towards a peak of {PEAK} node clusters. Reserve spot instances in October to lock in 40% compute discounts."
            },
            staffing: {
                title: "Customer Support Agents",
                subtitle: "Scheduling technical success support shifts.",
                unit: " agents",
                kpiCaption: "Peak support team size",
                historical: [18, 19, 21, 22, 22, 23, 24, 23, 26],
                seasonality: [0.96, 0.94, 1.02, 1.01, 0.98, 1.04, 1.05, 0.97, 1.08, 1.10, 1.15, 1.12],
                insightTemplate: "Technical support ticket volume will require {PEAK} agents. Leverage tier-1 AI chat agent triggers to resolve standard onboarding issues instantly."
            },
            revenue: {
                title: "Monthly Recurring Revenue",
                subtitle: "Predicting SaaS MRR growth and account expansions.",
                unit: " USD",
                kpiCaption: "Projected MRR next cycle",
                historical: [360000, 390000, 420000, 440000, 430000, 460000, 480000, 470000, 510000],
                seasonality: [0.96, 0.94, 1.02, 1.01, 0.98, 1.04, 1.05, 0.97, 1.08, 1.10, 1.15, 1.12],
                insightTemplate: "MRR is projected to scale to {PEAK}. Enterprise billing cycles in December are expected to increase average invoice values by 18%."
            }
        }
    }
};

const DEFAULT_HISTORICAL_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
const DEFAULT_FORECAST_LABELS = ["Oct (F)", "Nov (F)", "Dec (F)", "Jan (F)", "Feb (F)", "Mar (F)"];

// ==========================================================================
// 2. Global State Variables
// ==========================================================================

let appMode = "landing"; // "landing" or "app"
let activeTab = "landing"; // "landing", "dashboard", "datalab", "howworks"
let activeIndustry = "retail";
let activeModule = "demand";
let chartType = "line"; // "line" or "bar"
let chartInstance = null;

// Custom uploaded dataset store
let customDataset = {
    hasData: false,
    fileName: "",
    labels: [],
    values: [],
    // Cache analyzed stats
    stats: {
        recordCount: 0,
        mean: 0,
        trend: "Stable",
        slope: 0
    }
};

// ==========================================================================
// 3. Document Ready Initialization
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Render the Quick Industry preset buttons
    renderPresetButtons();

    // Set up navigation tab handlers
    setupNavigation();

    // Set up interactive button and dropzone events
    setupEventHandlers();

    // Load initial default simulation preview
    updateApplicationState();
});

// ==========================================================================
// 4. Navigation & Interface State Handlers
// ==========================================================================

function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetTab = item.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    // Brand logo click goes home
    document.getElementById("brand-logo-btn").addEventListener("click", () => {
        switchTab("landing");
    });
}

function switchTab(tabKey) {
    activeTab = tabKey;

    // Toggle Sidebar Nav active classes
    document.querySelectorAll(".nav-item").forEach(nav => {
        nav.classList.remove("active");
        if (nav.getAttribute("data-tab") === tabKey) {
            nav.classList.add("active");
        }
    });

    // Toggle structural view displays
    document.querySelectorAll(".tab-pane").forEach(pane => {
        pane.classList.remove("active");
    });
    document.getElementById(`tab-${tabKey}`).classList.add("active");

    // Header bar visibility
    const mainHeader = document.getElementById("main-header");
    if (tabKey === "landing") {
        mainHeader.style.display = "none";
        appMode = "landing";
    } else {
        mainHeader.style.display = "flex";
        appMode = "app";
    }

    // Update state & rebuild layouts if dashboard is active
    if (tabKey === "dashboard") {
        initOrUpdateChart();
        updateAIInsight();
    } else if (tabKey === "datalab") {
        updateDataLabPreview();
    }

    // Trigger MathJax rendering if LaTeX formulas are present on screen
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch(err => console.log('MathJax error:', err));
    }

    // Scroll back to top
    document.querySelector(".main-content").scrollTop = 0;
}

function renderPresetButtons() {
    const container = document.getElementById("presets-buttons-container");
    container.innerHTML = "";

    const industries = [
        { key: "retail", name: "Retail Sales", icon: "🛍️" },
        { key: "restaurant", name: "Diner Bookings", icon: "🍕" },
        { key: "healthcare", name: "ER Admissions", icon: "🏥" },
        { key: "manufacturing", name: "QC Shipments", icon: "⚙️" },
        { key: "education", name: "School Apps", icon: "🎓" },
        { key: "marketing", name: "Promo Leads", icon: "📣" },
        { key: "finance", name: "SaaS MRR Growth", icon: "💻" }
    ];

    industries.forEach(ind => {
        const btn = document.createElement("button");
        btn.className = "btn-preset";
        btn.setAttribute("data-ind", ind.key);
        btn.innerHTML = `
            <span class="preset-icon">${ind.icon}</span>
            <span>${ind.name}</span>
        `;
        btn.addEventListener("click", () => {
            // Select industry & update state
            activeIndustry = ind.key;
            document.getElementById("industry-select").value = ind.key;
            
            // Highlight active button
            document.querySelectorAll(".btn-preset").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Reset custom data flag so we fall back to defaults
            customDataset.hasData = false;
            
            showToast(`Loaded ${ind.name} sample dataset!`, "success");
            updateApplicationState();
            
            // Automatically switch back to Dashboard view so they can see it instantly
            setTimeout(() => {
                switchTab("dashboard");
            }, 500);
        });
        container.appendChild(btn);
    });
}

function setupEventHandlers() {
    // Landing page CTAs
    document.getElementById("btn-enter-dashboard").addEventListener("click", () => {
        switchTab("dashboard");
    });
    
    document.getElementById("btn-goto-datalab").addEventListener("click", () => {
        switchTab("datalab");
    });

    document.getElementById("btn-read-workflow").addEventListener("click", () => {
        switchTab("howworks");
    });

    // Top Header Industry dropdown change
    document.getElementById("industry-select").addEventListener("change", (e) => {
        activeIndustry = e.target.value;
        
        // Match preset grid active classes
        document.querySelectorAll(".btn-preset").forEach(btn => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-ind") === activeIndustry) {
                btn.classList.add("active");
            }
        });

        // Trigger updates
        showToast(`Profile profile switched to ${INDUSTRY_PROFILES[activeIndustry].name}`, "info");
        updateApplicationState();
    });

    // Toggle between line and bar charts
    document.getElementById("btn-chart-line").addEventListener("click", (e) => {
        document.getElementById("btn-chart-line").classList.add("active");
        document.getElementById("btn-chart-bar").classList.remove("active");
        chartType = "line";
        initOrUpdateChart();
    });

    document.getElementById("btn-chart-bar").addEventListener("click", (e) => {
        document.getElementById("btn-chart-line").classList.remove("active");
        document.getElementById("btn-chart-bar").classList.add("active");
        chartType = "bar";
        initOrUpdateChart();
    });

    // 4 Dashboard Card clicks
    const moduleCards = document.querySelectorAll(".module-card");
    moduleCards.forEach(card => {
        card.addEventListener("click", () => {
            moduleCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeModule = card.getAttribute("data-module");
            
            updateApplicationState();
        });
    });

    // Data Lab File browse button
    const fileInput = document.getElementById("csv-file-input");
    document.getElementById("btn-browse-csv").addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleCSVFile(e.target.files[0]);
        }
    });

    // CSV Dropzone drag & drop support
    const dropzone = document.getElementById("csv-dropzone");
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("dragover");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length > 0) {
            handleCSVFile(e.dataTransfer.files[0]);
        }
    });

    // Reset dataset to preset defaults
    document.getElementById("btn-reset-data").addEventListener("click", () => {
        customDataset.hasData = false;
        customDataset.fileName = "";
        customDataset.labels = [];
        customDataset.values = [];
        showToast("Reset to default system data profiles.", "info");
        updateApplicationState();
    });
}

// ==========================================================================
// 5. CSV File Parsing & Integration
// ==========================================================================

function handleCSVFile(file) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
        showToast("Invalid file type. Please upload a .csv file.", "warning");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSVData(text, file.name);
    };
    reader.readAsText(file);
}

function parseCSVData(rawText, fileName) {
    const lines = rawText.split(/\r?\n/);
    if (lines.length < 3) {
        showToast("Dataset contains insufficient rows to build forecast models.", "warning");
        return;
    }

    const parsedLabels = [];
    const parsedValues = [];

    // Parse header and look for column indices
    const headers = lines[0].split(",");
    let dateColIdx = 0;
    let valColIdx = 1;

    // Scan headers to automatically map Date and Value columns
    headers.forEach((h, idx) => {
        const norm = h.toLowerCase().trim();
        if (norm.includes("date") || norm.includes("month") || norm.includes("year") || norm.includes("period") || norm.includes("time")) {
            dateColIdx = idx;
        } else if (norm.includes("value") || norm.includes("sales") || norm.includes("amount") || norm.includes("quantity") || norm.includes("count") || norm.includes("revenue") || norm.includes("admissions") || norm.includes("load")) {
            valColIdx = idx;
        }
    });

    // Parse remaining data records
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty rows

        // Clean commas inside quotes to handle formatted numbers (e.g., "14,000" -> 14000)
        const safeLine = line.replace(/"([^"]+)"/g, (match, p1) => p1.replace(/,/g, ''));
        const parts = safeLine.split(",");
        if (parts.length <= Math.max(dateColIdx, valColIdx)) continue;

        const dateStr = parts[dateColIdx].replace(/["']/g, "").trim();
        const valNum = parseFloat(parts[valColIdx].replace(/["']/g, "").trim());

        if (dateStr && !isNaN(valNum)) {
            parsedLabels.push(dateStr);
            parsedValues.push(valNum);
        }
    }

    if (parsedLabels.length < 4) {
        showToast("Parsed less than 4 data points. Linear trend lines require more inputs.", "warning");
        return;
    }

    // Cache to state
    customDataset.hasData = true;
    customDataset.fileName = fileName;
    customDataset.labels = parsedLabels;
    customDataset.values = parsedValues;

    // Run regression calculations to cache stats
    const stats = runOLSLinearRegression(parsedValues);
    customDataset.stats.recordCount = parsedValues.length;
    customDataset.stats.mean = stats.mean;
    customDataset.stats.slope = stats.slope;
    customDataset.stats.trend = stats.slope > 0.05 ? "Upward Growth" : (stats.slope < -0.05 ? "Downward Decline" : "Stable Flat");

    showToast(`Successfully ingested "${fileName}" (${parsedValues.length} rows)`, "success");
    
    // Switch state and views
    updateApplicationState();
    setTimeout(() => {
        switchTab("dashboard");
    }, 600);
}

// ==========================================================================
// 6. Time-Series Forecasting Mathematics
// ==========================================================================

/**
 * Computes Ordinary Least Squares (OLS) Linear Regression: y = mx + c
 * And returns average value and slope.
 */
function runOLSLinearRegression(dataArray) {
    const n = dataArray.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += dataArray[i];
        sumXY += i * dataArray[i];
        sumXX += i * i;
    }

    const mean = sumY / n;
    const slopeDenominator = (n * sumXX - sumX * sumX);
    
    // Fallback if index variance is 0 (should never happen for chronological indices)
    const slope = slopeDenominator !== 0 ? (n * sumXY - sumX * sumY) / slopeDenominator : 0;
    const intercept = (sumY - slope * sumX) / n;

    // Compute residual Standard Error (S_e)
    let sumSquaredResiduals = 0;
    for (let i = 0; i < n; i++) {
        const trendVal = slope * i + intercept;
        const residual = dataArray[i] - trendVal;
        sumSquaredResiduals += residual * residual;
    }
    const standardError = n > 2 ? Math.sqrt(sumSquaredResiduals / (n - 2)) : mean * 0.05;

    return { slope, intercept, mean, standardError };
}

/**
 * Main prediction sequencer. Combines OLS trend projection with periodic seasonal indices
 * and confidence intervals.
 */
function calculatePredictions(historicalLabels, historicalValues, seasonalMultipliers, forecastHorizon = 6) {
    const n = historicalValues.length;
    
    // 1. Calculate base OLS linear trend
    const regression = runOLSLinearRegression(historicalValues);
    const slope = regression.slope;
    const intercept = regression.intercept;
    const standardError = regression.standardError;

    const forecastedValues = [];
    const upperConfidence = [];
    const lowerConfidence = [];

    // 2. Extrapolate future indexes
    for (let i = 0; i < forecastHorizon; i++) {
        const targetIndex = n + i;
        const baseTrend = slope * targetIndex + intercept;

        // Apply seasonal multiplier. If we have custom CSV data, we default to standard multi,
        // or loop the index modulo seasonal cycle length.
        const seasonalIdx = targetIndex % seasonalMultipliers.length;
        const multiplier = seasonalMultipliers[seasonalIdx];
        
        let predictedValue = baseTrend * multiplier;

        // Prevent negative values in positive metrics
        if (predictedValue < 0) predictedValue = 0;

        // Compute 95% Confidence Band limit (1.96 standard deviations)
        // Adjust width of error band progressively wider as we forecast further out
        const errorAccumulator = standardError * (1.0 + (i * 0.15));
        const upperLimit = predictedValue + (1.96 * errorAccumulator);
        const lowerLimit = Math.max(0, predictedValue - (1.96 * errorAccumulator));

        forecastedValues.push(Math.round(predictedValue));
        upperConfidence.push(Math.round(upperLimit));
        lowerConfidence.push(Math.round(lowerLimit));
    }

    return {
        forecastedValues,
        upperConfidence,
        lowerConfidence,
        slope,
        mean: regression.mean,
        standardError
    };
}

// ==========================================================================
// 7. Interactive Chart.js Configurations
// ==========================================================================

function initOrUpdateChart() {
    const canvas = document.getElementById("predictiveForecastChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Gather active metrics datasets
    const activeConf = INDUSTRY_PROFILES[activeIndustry].modules[activeModule];
    
    let labels = [];
    let actuals = [];
    let predicted = [];
    let upperConf = [];
    let lowerConf = [];
    let slopeTrend = 0;
    let standardError = 0;

    const isUsingCustom = customDataset.hasData;

    if (isUsingCustom) {
        labels = [...customDataset.labels];
        actuals = [...customDataset.values];
        
        // Generate forecast dates labels (e.g. Month 10 (F), Month 11 (F))
        const lastDate = labels[labels.length - 1];
        const forecastLabels = [];
        for (let i = 1; i <= 6; i++) {
            forecastLabels.push(`P+${i}`);
        }

        // Run prediction formulas using the Retail seasonal coefficients as baseline fallback
        const calculations = calculatePredictions(labels, actuals, activeConf.seasonality, 6);
        predicted = calculations.forecastedValues;
        upperConf = calculations.upperConfidence;
        lowerConf = calculations.lowerConfidence;
        slopeTrend = calculations.slope;
        standardError = calculations.standardError;

        labels = [...labels, ...forecastLabels];
    } else {
        labels = [...DEFAULT_HISTORICAL_LABELS, ...DEFAULT_FORECAST_LABELS];
        actuals = [...activeConf.historical];
        
        const calculations = calculatePredictions(DEFAULT_HISTORICAL_LABELS, actuals, activeConf.seasonality, 6);
        predicted = calculations.forecastedValues;
        upperConf = calculations.upperConfidence;
        lowerConf = calculations.lowerConfidence;
        slopeTrend = calculations.slope;
        standardError = calculations.standardError;
    }

    // Align arrays for dual line chart structure (Historical vs Forecasted)
    const historicalDataset = [...actuals, ...Array(predicted.length).fill(null)];
    
    // Forecast projection connects directly to the last historical point
    const lastHistoricalVal = actuals[actuals.length - 1];
    const projectionDataset = [...Array(actuals.length - 1).fill(null), lastHistoricalVal, ...predicted];
    const upperConfDataset = [...Array(actuals.length - 1).fill(null), lastHistoricalVal, ...upperConf];
    const lowerConfDataset = [...Array(actuals.length - 1).fill(null), lastHistoricalVal, ...lowerConf];

    // Determine brand accents colors based on current active card
    let accentColor = "#06b6d4";
    let accentGlow = "rgba(6, 182, 212, 0.05)";
    if (activeModule === "inventory") {
        accentColor = "#8b5cf6";
        accentGlow = "rgba(139, 92, 246, 0.05)";
    } else if (activeModule === "staffing") {
        accentColor = "#10b981";
        accentGlow = "rgba(16, 185, 129, 0.05)";
    } else if (activeModule === "revenue") {
        accentColor = "#f43f5e";
        accentGlow = "rgba(244, 63, 94, 0.05)";
    }

    // Destroy existing instance to redraw fresh chart
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Set default Chart styles
    Chart.defaults.color = "#94a3b8";
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    Chart.defaults.borderColor = "rgba(255, 255, 255, 0.04)";

    chartInstance = new Chart(ctx, {
        type: chartType,
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Historical Actuals",
                    data: historicalDataset,
                    borderColor: "#3b82f6",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderWidth: 3,
                    pointBackgroundColor: "#3b82f6",
                    pointRadius: chartType === "bar" ? 0 : 4,
                    pointHoverRadius: 6,
                    tension: 0.25,
                    fill: false
                },
                {
                    label: "Predicted Data",
                    data: projectionDataset,
                    borderColor: accentColor,
                    backgroundColor: accentGlow,
                    borderWidth: 3,
                    borderDash: chartType === "bar" ? [] : [5, 5],
                    pointBackgroundColor: accentColor,
                    pointRadius: chartType === "bar" ? 0 : 4,
                    pointHoverRadius: 6,
                    tension: 0.25,
                    fill: false
                },
                {
                    label: "Upper Confidence Limit (95%)",
                    data: upperConfDataset,
                    borderColor: "rgba(255, 255, 255, 0)",
                    borderWidth: 0,
                    pointRadius: 0,
                    tension: 0.25,
                    fill: "+1",
                    backgroundColor: "rgba(255, 255, 255, 0.02)"
                },
                {
                    label: "Lower Confidence Limit (95%)",
                    data: lowerConfDataset,
                    borderColor: "rgba(255, 255, 255, 0)",
                    borderWidth: 0,
                    pointRadius: 0,
                    tension: 0.25,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "top",
                    labels: {
                        boxWidth: 10,
                        usePointStyle: true,
                        font: { size: 11, weight: "bold" }
                    }
                },
                tooltip: {
                    padding: 12,
                    backgroundColor: "#050811",
                    titleFont: { size: 12, weight: "bold" },
                    bodyFont: { size: 12 },
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    grid: { color: "rgba(255, 255, 255, 0.04)" },
                    ticks: {
                        callback: v => formatMetricUnit(v, activeConf.unit)
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });

    // Update state descriptors
    document.getElementById("chart-section-title").textContent = `${activeConf.title} Projection`;
    document.getElementById("chart-section-subtitle").textContent = isUsingCustom ? 
        `Visualizing custom user CSV file "${customDataset.fileName}" with seasonal extrapolation.` :
        `Comparing 9 months of historical data with 6 months of AI-modeled trends.`;

    document.getElementById("chart-data-source-type").textContent = isUsingCustom ? 
        `Source: Custom CSV` : `Source: Sample Preset`;
}

function formatMetricUnit(value, unit) {
    if (unit.trim() === "USD") {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
        return `$${value}`;
    }
    // Number formatting
    if (value >= 100000) return `${(value / 1000).toFixed(0)}k${unit}`;
    return `${value.toLocaleString()}${unit}`;
}

// ==========================================================================
// 8. AI Insights Panel Generator
// ==========================================================================

function updateAIInsight() {
    const activeConf = INDUSTRY_PROFILES[activeIndustry].modules[activeModule];
    const isUsingCustom = customDataset.hasData;

    let labels = isUsingCustom ? customDataset.labels : DEFAULT_HISTORICAL_LABELS;
    let actuals = isUsingCustom ? customDataset.values : activeConf.historical;
    
    // Execute predictions
    const predictions = calculatePredictions(labels, actuals, activeConf.seasonality, 6);
    const predictedValues = predictions.forecastedValues;
    const slope = predictions.slope;

    // Find peaks and safety buffers
    const peakForecastVal = Math.max(...predictedValues);
    const bufferVal = Math.round(predictions.standardError * 1.5);

    // Format metrics values
    const peakStr = formatMetricUnit(peakForecastVal, activeConf.unit);
    const bufferStr = formatMetricUnit(bufferVal, activeConf.unit);

    // Inject parameters into industry insight templates
    let text = activeConf.insightTemplate
        .replace(/{PEAK}/g, `<strong>${peakStr}</strong>`)
        .replace(/{BUFFER}/g, `<strong>${bufferStr}</strong>`);

    // Add regression slope observations
    const pctMonthlyShift = ((slope / predictions.mean) * 100).toFixed(1);
    if (slope > 0.02) {
        text += ` <br><br>💡 <strong>Model Analysis:</strong> The OLS baseline is rising at <strong>+${pctMonthlyShift}%</strong> month-over-month. This suggests strong intrinsic growth momentum separate from standard seasonal variations. Allocate strategic capital to support expansion.`;
    } else if (slope < -0.02) {
        text += ` <br><br>⚠️ <strong>Model Analysis:</strong> The OLS baseline is declining at <strong>${pctMonthlyShift}%</strong> month-over-month. Ensure pricing and acquisition parameters are reviewed to reverse consolidation trends.`;
    } else {
        text += ` <br><br>ℹ️ <strong>Model Analysis:</strong> Stable OLS regression path. Current variance remains within normal operational bounds of <strong>±${((predictions.standardError / predictions.mean) * 100).toFixed(1)}%</strong>. Maintain current baseline allocations.`;
    }

    document.getElementById("ai-insight-text").innerHTML = text;
}

// ==========================================================================
// 8.5 Dynamic Theme Accent Color Control
// ==========================================================================

function updateThemeColors(moduleName) {
    let accent = "#06b6d4";
    let glow = "rgba(6, 182, 212, 0.15)";
    let glowUltraLow = "rgba(6, 182, 212, 0.02)";
    
    if (moduleName === "inventory") {
        accent = "#8b5cf6";
        glow = "rgba(139, 92, 246, 0.15)";
        glowUltraLow = "rgba(139, 92, 246, 0.02)";
    } else if (moduleName === "staffing") {
        accent = "#10b981";
        glow = "rgba(16, 185, 129, 0.15)";
        glowUltraLow = "rgba(16, 185, 129, 0.02)";
    } else if (moduleName === "revenue") {
        accent = "#f43f5e";
        glow = "rgba(244, 63, 94, 0.15)";
        glowUltraLow = "rgba(244, 63, 94, 0.02)";
    }
    
    document.documentElement.style.setProperty('--theme-accent', accent);
    document.documentElement.style.setProperty('--theme-accent-glow', glow);
    document.documentElement.style.setProperty('--theme-accent-glow-ultra-low', glowUltraLow);
}

// ==========================================================================
// 9. UI State Syncer & Data Previews
// ==========================================================================

function updateApplicationState() {
    // Dynamic theme color update matching the active module
    updateThemeColors(activeModule);

    // 1. Calculate values for 4 Module Cards
    const modules = ["demand", "inventory", "staffing", "revenue"];
    
    modules.forEach(mod => {
        const conf = INDUSTRY_PROFILES[activeIndustry].modules[mod];
        let values = [...conf.historical];
        
        // If custom CSV is loaded and matches module active state, use CSV values
        if (customDataset.hasData && activeModule === mod) {
            values = [...customDataset.values];
        }

        const predictions = calculatePredictions(DEFAULT_HISTORICAL_LABELS, values, conf.seasonality, 6);
        const nextValue = predictions.forecastedValues[0]; // first predicted value
        
        // Update Card KPIs
        const kpiEl = document.getElementById(`${mod}-kpi`);
        kpiEl.textContent = formatMetricUnit(nextValue, conf.unit);
        
        // Update captions
        const changeEl = document.getElementById(`${mod}-change`);
        const delta = ((nextValue - values[values.length - 1]) / values[values.length - 1] * 100).toFixed(1);
        
        if (mod === "inventory") {
            const safetyBuffer = Math.round(predictions.standardError * 1.5);
            changeEl.textContent = `buffer limit: ${formatMetricUnit(safetyBuffer, conf.unit)}`;
            
            // Adjust inventory card status badge
            const bufferRatio = safetyBuffer / nextValue;
            const statusPill = document.getElementById("inventory-status-pill");
            if (bufferRatio > 0.25) {
                statusPill.textContent = "High Risk";
                statusPill.className = "card-status-pill yellow";
            } else {
                statusPill.textContent = "Optimal";
                statusPill.className = "card-status-pill green";
            }
        } else {
            changeEl.textContent = `${delta > 0 ? "+" : ""}${delta}% predicted change`;
        }
    });

    // 2. Redraw active visualization
    if (activeTab === "dashboard") {
        initOrUpdateChart();
        updateAIInsight();
    } else if (activeTab === "datalab") {
        updateDataLabPreview();
    }
}

function updateDataLabPreview() {
    const activeConf = INDUSTRY_PROFILES[activeIndustry].modules[activeModule];
    const isUsingCustom = customDataset.hasData;

    const dataBadge = document.getElementById("data-status-badge");
    const recordsEl = document.getElementById("stats-records");
    const meanEl = document.getElementById("stats-mean");
    const trendEl = document.getElementById("stats-trend");

    let labels = [];
    let values = [];

    if (isUsingCustom) {
        labels = customDataset.labels;
        values = customDataset.values;
        dataBadge.textContent = "Custom CSV Dataset Active";
        dataBadge.className = "preview-badge"; // Green style
        
        recordsEl.textContent = `${values.length} records`;
        meanEl.textContent = formatMetricUnit(customDataset.stats.mean, activeConf.unit);
        trendEl.textContent = customDataset.stats.trend;
        trendEl.className = "stat-val " + (customDataset.stats.slope > 0 ? "positive" : (customDataset.stats.slope < 0 ? "negative" : "neutral"));
    } else {
        labels = DEFAULT_HISTORICAL_LABELS;
        values = activeConf.historical;
        dataBadge.textContent = "Default Simulation Preset";
        dataBadge.className = "preview-badge status-badge historical"; // Indigo style
        
        const stats = runOLSLinearRegression(values);
        recordsEl.textContent = `${values.length} records`;
        meanEl.textContent = formatMetricUnit(stats.mean, activeConf.unit);
        trendEl.textContent = stats.slope > 0 ? "Upward Growth" : "Consolidating";
        trendEl.className = "stat-val positive";
    }

    // Render Raw Table Preview
    const tableBody = document.getElementById("data-preview-table").querySelector("tbody");
    tableBody.innerHTML = "";

    labels.forEach((lbl, idx) => {
        const tr = document.createElement("tr");
        const valStr = formatMetricUnit(values[idx], activeConf.unit);
        tr.innerHTML = `
            <td><strong>${lbl}</strong></td>
            <td>${valStr}</td>
            <td><span class="status-badge historical">Historical</span></td>
        `;
        tableBody.appendChild(tr);
    });
}

// ==========================================================================
// 10. Toast Notification Manager
// ==========================================================================

function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Add brief status icon
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto dismiss
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s ease reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}
