
import { normalizeContent } from "../lib/formatter";
import { calculateDiffRows } from "../lib/diff-utils";

console.log("=== TEST START: Diff Logic Verification ===\n");

const tests = [
    {
        name: "Basic Gym Scenario (Shifted Sentences)",
        original: `- I went to the gym on every weekend.
- If I'm not tired, I wanna go to the gym four times a week.`,
        corrected: `I go to the gym every weekend.
If I'm not tired, I wanna go to the gym 2 to 3 times a week.
In fact, I go to the gym 2 to 3 times a week.`
    },
    {
        name: "Diet Scenario (Broken Sentences)",
        original: `- Colleagues said to me, "you look lose your weight and more healthy"
lost my weight to the goal I wanted.`,
        corrected: `My colleagues said, "You look like you lost your weight and you look healthier."
I lost my weight to the goal I wanted.`
    },
    {
        name: "Abbreviations Scenario (a.m./p.m.)",
        original: `My company allows me to work remotely.
The working time on Monday is 1 to 6 p.m.`,
        corrected: `My company allow to remote work.
And the working time on monday is 1 to 6 p.m.`
    },
    {
        name: "Quotes Scenario",
        original: `Colleagues said to me, "you look healthy".
I was happy.`,
        corrected: `My colleagues said, "You look healthier."
I was very happy.`
    },
    {
        name: "User Provided Text (Demon Slayer)",
        original: `I watched a movie at the Time Square in Yeongdeungpo.
The movie is Demon Slayer(귀멸의 칼날), which is popular Japanese animation.
The story is about that human fight with demons, which is called by ‘Oni’ in japanese.
Both human and demons are characterful and attractive, so it is very interesting to watch.
Above all, the battle scene is very very specatular.
It is the most interesting movie what I watched recently.`,
        corrected: `I watched a movie at Times Square in Yeongdeungpo.
The movie is Demon Slayer, which is a popular Japanese animation.
The story is about humans fighting with demons, which are called 'Oni' in Japanese.
Both humans and demons are characterful and attractive, making it very interesting to watch.
Above all, the battle scene is very, very spectacular.
It is the most interesting movie I have watched recently.`
    },
    {
        name: "Merge Scenario (2 Sentences -> 1 Sentence)",
        original: `My company allow to remote work.
And the working time on monday is 1 to 6 p.m.`,
        corrected: `My company allows me to work remotely and the working time for Monday is 1 to 6 p.m.`
    },
    {
        name: "Low Similarity Scenario (Medicine)",
        original: `I was helped by diet medicine.`,
        corrected: `I actually got some help from the medicine; wegovy.`
    },
    {
        name: "Drastic Rewrite 1 (Analyst)",
        original: `Moreover, I'm an only data analyst in not only my teambut also division, so many people ask to me for help if they need to analyze data.`,
        corrected: `On top of that, I'm the only data analyst not just in my team, but in the entire division.
So whenever someone needs help with data analysis, they come to me.`
    },
    {
        name: "Drastic Rewrite 2 (Hard days)",
        original: `It's a really hard days.`,
        corrected: `These days have been really tough.`
    },
    {
        name: "Drastic Rewrite 3 (Travel light)",
        original: `I like to travel light because if I bring a lot of things, I can't bring my luggage in the plane so always I bring a little things.`,
        corrected: `I like to travel light because if I bring a lot of things, I can't take my luggage in the plane.
So I always try to take the least.`
    },
    {
        name: "Drastic Rewrite 4 (Medicine Relieve)",
        original: `I wanna take some medicine for reliable for me.`,
        corrected: `I try to take some medicine to relieve my stress.`
    },
    {
        name: "Drastic Rewrite 5 (Another card)",
        original: `Would you give me another card?`,
        corrected: `Do you have another one?`
    },
    {
        name: "Edge Case 1 (Batch/Session)",
        original: `Our company club opens a new batch and closes the batch by every 6 months.
And, It was the last time dinner of this batch.`,
        corrected: `Our company club opens a new session every 6 months.
At the same time, it was last dinner with this session.`
    },
    {
        name: "Edge Case 2 (First dinner leader)",
        original: `Moreover, It was the first time dinner when I became a leader of the club.`,
        corrected: `It was the first time to have dinner with the club member since I became the leader.`
    },
    {
        name: "Edge Case 3 (Guided tour merge)",
        original: `We asked the question about their experiences about guided tour.
For example,.`,
        corrected: `We asked questions about their experiences about the guided tour. The questions were:.`
    }
];

tests.forEach((t, i) => {
    console.log(`\n--- Test Case ${i + 1}: ${t.name} ---`);

    const normOrg = normalizeContent(t.original);
    const normCorr = normalizeContent(t.corrected);

    console.log("[Normalized Original]:\n", normOrg);
    console.log("[Normalized Corrected]:\n", normCorr);

    const diffs = calculateDiffRows(normOrg, normCorr);

    console.log("\n[Diff Result]:");
    diffs.forEach(d => {
        if (d.type === 'unchanged') {
            console.log(`[Unchanged] ${d.original}`);
        } else if (d.type === 'modified') {
            console.log(`[Modified]`);
            console.log(`  < ${d.original}`);
            console.log(`  > ${d.corrected}`);
        } else if (d.type === 'added') {
            console.log(`[Added]     > ${d.corrected}`);
        } else if (d.type === 'removed') {
            console.log(`[Removed]   < ${d.original}`);
        }
    });
});

console.log("\n=== TEST END ===");
