import * as reiprich from "./scripts/AlexanderReiprich.js";
import * as nguyen from "./scripts/BaoHanNguyen.js";
import * as meisler from "./scripts/DanielMeisler.js";
import * as grabs from "./scripts/DominikGrabs.js";
import * as kowatsch from "./scripts/FabianKowatsch.js";
import * as mieg from "./scripts/FabianMieg.js";
import * as goepfert from "./scripts/FerdinandGoepfert.js";
import * as gobbert from "./scripts/LeonGobbert.js";
import * as cataldo from "./scripts/LucaCataldo.js";
import * as rubner from "./scripts/NicRubner.js";
import * as gaertner from "./scripts/NikitaGaertner.js";
import * as weiden from "./scripts/SarahWeidenhiller.js";
import * as winter from "./scripts/SoerenWinterhalder.js";


/// Show the desired scene
function showScene(scene) {
    switch (scene) {
        case 0:
            reiprich.main();
            break;
        case 1:
            nguyen.main();
            break;
        case 2:
            meisler.main();
            break;
        case 3:
            grabs.main()
            break
        case 4:
            kowatsch.main()
            break
        case 5:
            mieg.main()
            break
        case 6:
            goepfert.main()
            break
        case 7:
            gobbert.main()
            break
        case 8:
            cataldo.main()
            break
        case 9:
            rubner.main()
            break
        case 10:
            gaertner.main()
            break
        case 11:
            weiden.main()
            break
        case 12:
            winter.main()
            break
    }
}

showScene(12);