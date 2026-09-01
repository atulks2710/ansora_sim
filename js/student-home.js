// =====================================================
// SKILLBRIDGE STUDENT DASHBOARD
// Firebase + Firestore + Cloudinary
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

// Your Cloudinary Cloud Name
const CLOUDINARY_CLOUD_NAME = "dvrzhdeas";

// Your unsigned upload preset
const CLOUDINARY_UPLOAD_PRESET = "skillbridge_profile";


// =====================================================
// HTML ELEMENTS
// =====================================================


// ---------- Welcome ----------

const welcomeName =
    document.getElementById("welcomeName");

const currentDate =
    document.getElementById("currentDate");


// ---------- Top Profile ----------

const topName =
    document.getElementById("topName");

const topInitial =
    document.getElementById("topInitial");

const topProfileImage =
    document.getElementById("topProfileImage");


// ---------- Main Profile ----------

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileInitial =
    document.getElementById("profileInitial");

const profileImage =
    document.getElementById("profileImage");


// ---------- Completion ----------

const completionInitial =
    document.getElementById("completionInitial");

const completionAvatar =
    document.getElementById("completionAvatar");

const completionPercent =
    document.getElementById("completionPercent");

const profileProgress =
    document.getElementById("profileProgress");

const profileScore =
    document.getElementById("profileScore");


// ---------- Profile Fields ----------

const collegeValue =
    document.getElementById("collegeValue");

const courseValue =
    document.getElementById("courseValue");

const yearValue =
    document.getElementById("yearValue");

const locationValue =
    document.getElementById("locationValue");


// ---------- Statistics ----------

const skillsCount =
    document.getElementById("skillsCount");

const applicationsCount =
    document.getElementById("applicationsCount");

const matchesCount =
    document.getElementById("matchesCount");


// ---------- Profile Photo ----------

const profilePhotoInput =
    document.getElementById("profilePhotoInput");


// ---------- Logout ----------

const logoutBtn =
    document.getElementById("logoutBtn");


// ---------- Mobile Sidebar ----------

const menuButton =
    document.getElementById("menuButton");

const sidebar =
    document.getElementById("sidebar");


// ---------- Profile Modal ----------

const profileModal =
    document.getElementById("profileModal");

const editProfileButton =
    document.getElementById("editProfileButton");

const completeProfileButton =
    document.getElementById("completeProfileBtn");

const closeModal =
    document.getElementById("closeModal");

const cancelModal =
    document.getElementById("cancelModal");


// ---------- Profile Form ----------

const profileForm =
    document.getElementById("profileForm");

const profileSaveMessage =
    document.getElementById(
        "profileSaveMessage"
    );

const editName =
    document.getElementById("editName");

const editCollege =
    document.getElementById("editCollege");

const editCourse =
    document.getElementById("editCourse");

const editYear =
    document.getElementById("editYear");

const editLocation =
    document.getElementById("editLocation");

const editEmail =
    document.getElementById("editEmail");

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


// =====================================================
// CURRENT USER / PROFILE
// =====================================================

let currentUser = null;

let currentProfile = {};


// =====================================================
// AUTHENTICATION STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        // ---------------------------------------------
        // USER NOT LOGGED IN
        // ---------------------------------------------

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        // Store current user

        currentUser = user;


        try {

            await loadStudentProfile(
                user
            );

        }

        catch (error) {

            console.error(
                "Dashboard loading error:",
                error
            );

        }

    }
);


// =====================================================
// LOAD STUDENT PROFILE
// =====================================================

async function loadStudentProfile(user) {

    const userRef =
        doc(
            db,
            "users",
            user.uid
        );


    const userSnapshot =
        await getDoc(userRef);


    // -------------------------------------------------
    // PROFILE EXISTS
    // -------------------------------------------------

    if (userSnapshot.exists()) {

        currentProfile =
            userSnapshot.data();

    }


    // -------------------------------------------------
    // PROFILE DOES NOT EXIST
    // -------------------------------------------------

    else {

        currentProfile = {

            name:
                user.displayName ||
                "Student",

            email:
                user.email ||
                "",

            role:
                "student",

            photoURL:
                "",

            college:
                "",

            course:
                "",

            year:
                "",

            location:
                "",

            skills:
                [],

            applications:
                [],

            matchCount:
                0,

            profileCompleted:
                false,

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            userRef,
            currentProfile
        );

    }


    // =================================================
    // ROLE SECURITY CHECK
    // =================================================

    if (
        currentProfile.role &&
        currentProfile.role !== "student"
    ) {

        redirectWrongRole(
            currentProfile.role
        );

        return;

    }


    // =================================================
    // UPDATE DASHBOARD
    // =================================================

    updateDashboard(
        currentProfile
    );

}


// =====================================================
// UPDATE DASHBOARD UI
// =====================================================

function updateDashboard(profile) {


    // -------------------------------------------------
    // BASIC DATA
    // -------------------------------------------------

    const name =
        profile.name ||
        currentUser.displayName ||
        "Student";


    const email =
        profile.email ||
        currentUser.email ||
        "";


    const initial =
        getInitial(name);


    // -------------------------------------------------
    // NAME
    // -------------------------------------------------

    welcomeName.textContent =
        firstName(name);


    topName.textContent =
        name;


    profileName.textContent =
        name;


    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------

    profileEmail.textContent =
        email;


    editEmail.value =
        email;


    // -------------------------------------------------
    // INITIAL
    // -------------------------------------------------

    topInitial.textContent =
        initial;


    profileInitial.textContent =
        initial;


    completionInitial.textContent =
        initial;


    // -------------------------------------------------
    // PROFILE DETAILS
    // -------------------------------------------------

    collegeValue.textContent =
        profile.college ||
        "Not added";


    courseValue.textContent =
        profile.course ||
        "Not added";


    yearValue.textContent =
        formatYear(
            profile.year
        );


    locationValue.textContent =
        profile.location ||
        "Not added";


    // -------------------------------------------------
    // EDIT FORM
    // -------------------------------------------------

    editName.value =
        name;


    editCollege.value =
        profile.college ||
        "";


    editCourse.value =
        profile.course ||
        "";


    editYear.value =
        profile.year ||
        "";


    editLocation.value =
        profile.location ||
        "";


    // -------------------------------------------------
    // PROFILE COMPLETION
    // -------------------------------------------------

    const completion =
        calculateProfileCompletion(
            profile
        );


    completionPercent.textContent =
        `${completion}%`;


    profileScore.textContent =
        `${completion}%`;


    profileProgress.style.width =
        `${completion}%`;


    // -------------------------------------------------
    // STATISTICS
    // -------------------------------------------------

    skillsCount.textContent =
        Array.isArray(
            profile.skills
        )
            ? profile.skills.length
            : 0;


    applicationsCount.textContent =
        Array.isArray(
            profile.applications
        )
            ? profile.applications.length
            : 0;


    matchesCount.textContent =
        profile.matchCount ||
        0;


    // -------------------------------------------------
    // LOAD PROFILE PHOTO
    // -------------------------------------------------

    if (
        profile.photoURL &&
        profile.photoURL.trim() !== ""
    ) {

        setProfileImage(
            profile.photoURL
        );

    }

    else {

        showProfileInitial(
            initial
        );

    }

}


// =====================================================
// PROFILE COMPLETION
// =====================================================

function calculateProfileCompletion(
    profile
) {

    const fields = [

        profile.name,

        profile.email,

        profile.photoURL,

        profile.college,

        profile.course,

        profile.year,

        profile.location,

        profile.skills &&
        profile.skills.length

    ];


    const completed =
        fields.filter(
            value => {

                if (
                    Array.isArray(value)
                ) {

                    return value.length > 0;

                }


                return (
                    value !== undefined &&
                    value !== null &&
                    value !== ""
                );

            }
        ).length;


    return Math.round(
        (
            completed /
            fields.length
        ) * 100
    );

}


// =====================================================
// PROFILE PHOTO UPLOAD
// =====================================================

profilePhotoInput.addEventListener(
    "change",
    async () => {

        const file =
            profilePhotoInput.files[0];


        // ---------------------------------------------
        // NO FILE
        // ---------------------------------------------

        if (!file) {

            return;

        }


        // ---------------------------------------------
        // FILE TYPE CHECK
        // ---------------------------------------------

        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            alert(
                "Please select a JPG, PNG or WebP image."
            );

            profilePhotoInput.value = "";

            return;

        }


        // ---------------------------------------------
        // FILE SIZE CHECK
        // ---------------------------------------------

        const maxSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            alert(
                "Image size must be less than 5 MB."
            );

            profilePhotoInput.value = "";

            return;

        }


        // ---------------------------------------------
        // GET UPLOAD BUTTON
        // ---------------------------------------------

        const photoUploadButton =
            document.querySelector(
                ".photo-upload-button"
            );


        // ---------------------------------------------
        // SHOW LOCAL PREVIEW
        // ---------------------------------------------

        const localPreview =
            URL.createObjectURL(
                file
            );


        setProfileImage(
            localPreview
        );


        // ---------------------------------------------
        // DISABLE PHOTO BUTTON
        // ---------------------------------------------

        if (
            photoUploadButton
        ) {

            photoUploadButton.style.pointerEvents =
                "none";

            photoUploadButton.style.opacity =
                "0.5";

        }


        try {

            console.log(
                "Uploading image to Cloudinary..."
            );


            // ==========================================
            // FORM DATA
            // ==========================================

            const formData =
                new FormData();


            formData.append(
                "file",
                file
            );


            formData.append(
                "upload_preset",
                CLOUDINARY_UPLOAD_PRESET
            );


            // ==========================================
            // CLOUDINARY UPLOAD
            // ==========================================

            const response =
                await fetch(

                    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,

                    {

                        method:
                            "POST",

                        body:
                            formData

                    }

                );


            // ==========================================
            // CLOUDINARY RESPONSE
            // ==========================================

            const data =
                await response.json();


            // ==========================================
            // ERROR CHECK
            // ==========================================

            if (!response.ok) {

                console.error(
                    "Cloudinary error:",
                    data
                );


                throw new Error(

                    data.error?.message ||
                    "Cloudinary upload failed."

                );

            }


            // ==========================================
            // GET CLOUDINARY URL
            // ==========================================

            const imageURL =
                data.secure_url;


            console.log(
                "Cloudinary image URL:",
                imageURL
            );


            if (!imageURL) {

                throw new Error(
                    "Cloudinary did not return an image URL."
                );

            }


            // ==========================================
            // SAVE URL TO FIRESTORE
            // ==========================================

            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {

                    photoURL:
                        imageURL,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // ==========================================
            // UPDATE AUTH PROFILE
            // ==========================================

            try {

                await updateProfile(
                    currentUser,
                    {
                        photoURL:
                            imageURL
                    }
                );

            }

            catch (authError) {

                console.warn(
                    "Firebase Auth photo update failed:",
                    authError
                );

            }


            // ==========================================
            // UPDATE LOCAL PROFILE
            // ==========================================

            currentProfile.photoURL =
                imageURL;


            // ==========================================
            // DISPLAY PERMANENT IMAGE
            // ==========================================

            setProfileImage(
                imageURL
            );


            // ==========================================
            // RECALCULATE PROFILE COMPLETION
            // ==========================================

            const completion =
                calculateProfileCompletion(
                    currentProfile
                );


            completionPercent.textContent =
                `${completion}%`;


            profileScore.textContent =
                `${completion}%`;


            profileProgress.style.width =
                `${completion}%`;


            // ==========================================
            // SUCCESS
            // ==========================================

            showPhotoMessage(
                "Profile picture updated successfully.",
                "success"
            );


            console.log(
                "Profile picture successfully saved."
            );

        }


        catch (error) {

            console.error(
                "Profile image upload error:",
                error
            );


            // Restore existing saved profile

            if (
                currentProfile.photoURL
            ) {

                setProfileImage(
                    currentProfile.photoURL
                );

            }

            else {

                showProfileInitial(
                    getInitial(
                        currentProfile.name
                    )
                );

            }


            showPhotoMessage(
                error.message ||
                "Unable to upload profile picture.",
                "error"
            );

        }


        finally {

            // -----------------------------------------
            // ENABLE BUTTON
            // -----------------------------------------

            if (
                photoUploadButton
            ) {

                photoUploadButton.style.pointerEvents =
                    "auto";

                photoUploadButton.style.opacity =
                    "1";

            }


            // -----------------------------------------
            // CLEAR FILE INPUT
            // -----------------------------------------

            profilePhotoInput.value = "";


            // -----------------------------------------
            // RELEASE LOCAL URL
            // -----------------------------------------

            URL.revokeObjectURL(
                localPreview
            );

        }

    }
);


// =====================================================
// SHOW PROFILE IMAGE
// =====================================================

function setProfileImage(
    imageURL
) {

    // Main profile

    profileImage.innerHTML = "";

    const mainImage =
        document.createElement(
            "img"
        );

    mainImage.src =
        imageURL;

    mainImage.alt =
        "Student profile picture";

    mainImage.onerror =
        () => {

            showProfileInitial(
                getInitial(
                    currentProfile.name
                )
            );

        };


    profileImage.appendChild(
        mainImage
    );


    // Top profile

    topProfileImage.innerHTML = "";

    const topImage =
        document.createElement(
            "img"
        );

    topImage.src =
        imageURL;

    topImage.alt =
        "Student profile picture";

    topImage.onerror =
        () => {

            topProfileImage.innerHTML =
                `<span id="topInitial">
                    ${getInitial(currentProfile.name)}
                 </span>`;

        };


    topProfileImage.appendChild(
        topImage
    );


    // Completion avatar

    completionAvatar.innerHTML = "";

    const completionImage =
        document.createElement(
            "img"
        );

    completionImage.src =
        imageURL;

    completionImage.alt =
        "Student profile picture";

    completionImage.onerror =
        () => {

            completionAvatar.innerHTML =
                `<span id="completionInitial">
                    ${getInitial(currentProfile.name)}
                 </span>`;

        };


    completionAvatar.appendChild(
        completionImage
    );

}


// =====================================================
// SHOW INITIALS
// =====================================================

function showProfileInitial(
    initial
) {

    // Main profile

    profileImage.innerHTML =
        `<span id="profileInitial">
            ${initial}
         </span>`;


    // Top profile

    topProfileImage.innerHTML =
        `<span id="topInitial">
            ${initial}
         </span>`;


    // Completion avatar

    completionAvatar.innerHTML =
        `<span id="completionInitial">
            ${initial}
         </span>`;

}


// =====================================================
// PHOTO MESSAGE
// =====================================================

function showPhotoMessage(
    message,
    type
) {

    let messageElement =
        document.getElementById(
            "photoUploadMessage"
        );


    // Create element if it doesn't exist

    if (!messageElement) {

        messageElement =
            document.createElement(
                "div"
            );


        messageElement.id =
            "photoUploadMessage";


        messageElement.style.fontSize =
            "9px";


        messageElement.style.marginTop =
            "10px";


        profileImage.parentElement
            .parentElement
            .appendChild(
                messageElement
            );

    }


    messageElement.textContent =
        message;


    if (type === "success") {

        messageElement.style.color =
            "#26734D";

    }

    else {

        messageElement.style.color =
            "#B42318";

    }


    // Remove after a few seconds

    setTimeout(
        () => {

            messageElement.textContent =
                "";

        },
        4000
    );

}


// =====================================================
// EDIT PROFILE MODAL
// =====================================================

editProfileButton.addEventListener(
    "click",
    () => {

        openProfileModal();

    }
);


completeProfileButton.addEventListener(
    "click",
    () => {

        openProfileModal();

    }
);


// =====================================================
// OPEN MODAL
// =====================================================

function openProfileModal() {

    profileSaveMessage.textContent =
        "";

    profileSaveMessage.className =
        "profile-save-message";


    // Fill current values

    editName.value =
        currentProfile.name ||
        "";

    editCollege.value =
        currentProfile.college ||
        "";

    editCourse.value =
        currentProfile.course ||
        "";

    editYear.value =
        currentProfile.year ||
        "";

    editLocation.value =
        currentProfile.location ||
        "";

    editEmail.value =
        currentProfile.email ||
        "";


    profileModal.classList.add(
        "show"
    );

}


// =====================================================
// CLOSE MODAL
// =====================================================

closeModal.addEventListener(
    "click",
    closeProfileModal
);


cancelModal.addEventListener(
    "click",
    closeProfileModal
);


function closeProfileModal() {

    profileModal.classList.remove(
        "show"
    );

}


// =====================================================
// CLICK OUTSIDE MODAL
// =====================================================

profileModal.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            profileModal
        ) {

            closeProfileModal();

        }

    }
);


// =====================================================
// SAVE PROFILE
// =====================================================

profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            return;

        }


        // ---------------------------------------------
        // GET VALUES
        // ---------------------------------------------

        const name =
            editName.value.trim();


        const college =
            editCollege.value.trim();


        const course =
            editCourse.value.trim();


        const year =
            editYear.value;


        const location =
            editLocation.value.trim();


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name) {

            showSaveMessage(
                "Please enter your name.",
                "error"
            );

            return;

        }


        // ---------------------------------------------
        // LOADING
        // ---------------------------------------------

        saveProfileButton.disabled =
            true;


        saveProfileButton.textContent =
            "Saving...";


        try {

            // ==========================================
            // UPDATE FIRESTORE
            // ==========================================

            await updateDoc(

                doc(
                    db,
                    "users",
                    currentUser.uid
                ),

                {

                    name:
                        name,

                    college:
                        college,

                    course:
                        course,

                    year:
                        year,

                    location:
                        location,

                    updatedAt:
                        serverTimestamp()

                }

            );


            // ==========================================
            // UPDATE FIREBASE AUTH DISPLAY NAME
            // ==========================================

            try {

                await updateProfile(
                    currentUser,
                    {
                        displayName:
                            name
                    }
                );

            }

            catch (authError) {

                console.warn(
                    "Auth profile update failed:",
                    authError
                );

            }


            // ==========================================
            // UPDATE LOCAL DATA
            // ==========================================

            currentProfile.name =
                name;

            currentProfile.college =
                college;

            currentProfile.course =
                course;

            currentProfile.year =
                year;

            currentProfile.location =
                location;


            // ==========================================
            // UPDATE DASHBOARD
            // ==========================================

            updateDashboard(
                currentProfile
            );


            // ==========================================
            // SUCCESS
            // ==========================================

            showSaveMessage(
                "Profile updated successfully.",
                "success"
            );


            setTimeout(
                () => {

                    closeProfileModal();

                },
                800
            );

        }


        catch (error) {

            console.error(
                "Profile save error:",
                error
            );


            showSaveMessage(
                error.message ||
                "Unable to save profile.",
                "error"
            );

        }


        finally {

            saveProfileButton.disabled =
                false;


            saveProfileButton.innerHTML =
                'Save Changes <span>→</span>';

        }

    }
);


// =====================================================
// PROFILE SAVE MESSAGE
// =====================================================

function showSaveMessage(
    message,
    type
) {

    profileSaveMessage.textContent =
        message;


    profileSaveMessage.className =
        `profile-save-message ${type}`;

}


// =====================================================
// LOGOUT
// =====================================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );


            window.location.href =
                "index.html";

        }

        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// =====================================================
// CURRENT DATE
// =====================================================

if (currentDate) {

    const today =
        new Date();


    currentDate.textContent =
        today.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

}


// =====================================================
// MOBILE SIDEBAR
// =====================================================

if (menuButton && sidebar) {

    menuButton.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


// =====================================================
// CLOSE MOBILE SIDEBAR WHEN NAV ITEM CLICKED
// =====================================================

document
    .querySelectorAll(
        ".nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    if (sidebar) {

                        sidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }
    );


// =====================================================
// ROLE SAFETY REDIRECT
// =====================================================

function redirectWrongRole(
    role
) {

    switch (role) {

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

            window.location.href =
                "login.html";

    }

}


// =====================================================
// HELPER FUNCTIONS
// =====================================================

function getInitial(
    name
) {

    if (!name) {

        return "S";

    }


    return name
        .trim()
        .charAt(0)
        .toUpperCase();

}


function firstName(
    name
) {

    if (!name) {

        return "Student";

    }


    return name
        .trim()
        .split(/\s+/)[0];

}


function formatYear(
    year
) {

    if (!year) {

        return "Not added";

    }


    const years = {

        "1":
            "First Year",

        "2":
            "Second Year",

        "3":
            "Third Year",

        "4":
            "Final Year"

    };


    return years[year] ||
        year;

}