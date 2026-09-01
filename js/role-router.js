// ==========================================
// SKILLBRIDGE ROLE ROUTER
// ==========================================

export function redirectByRole(role) {

    switch (role) {

        case "student":

            window.location.href =
                "student-home.html";

            break;


        case "academician":

            window.location.href =
                "academician-home.html";

            break;


        case "industry":

            window.location.href =
                "industry-home.html";

            break;


        case "institution":

            window.location.href =
                "institution-home.html";

            break;


        default:

            console.error(
                "Unknown role:",
                role
            );

            window.location.href =
                "index.html";

    }

}