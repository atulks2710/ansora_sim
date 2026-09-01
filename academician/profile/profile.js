// =====================================================
// SKILLBRIDGE ACADEMICIAN PROFILE
// Firebase + Firestore + Cloudinary
// =====================================================


// =====================================================
// FIREBASE IMPORTS
// =====================================================

import {
    initializeApp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";


import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp
} from
"https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// FIREBASE CONFIG
// =====================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDKCs2W0KEcsPTiwdw1eHLdtq5zJQi4cmI",

    authDomain:
        "ansora-27fe4.firebaseapp.com",

    projectId:
        "ansora-27fe4",

    storageBucket:
        "ansora-27fe4.firebasestorage.app",

    messagingSenderId:
        "230795678686",

    appId:
        "1:230795678686:web:06f0ccd7b8717ac13ac34f"

};


// =====================================================
// FIREBASE INITIALIZATION
// =====================================================

const app =
    initializeApp(
        firebaseConfig
    );


const auth =
    getAuth(
        app
    );


const db =
    getFirestore(
        app
    );


// =====================================================
// CLOUDINARY
// =====================================================

const CLOUDINARY_CLOUD_NAME =
    "dvrzhdeas";


const CLOUDINARY_UPLOAD_PRESET =
    "skillbridge_profile";


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;

let currentUserData = {};

let currentAcademicianData = {};


// =====================================================
// DOM ELEMENTS
// =====================================================

// Top profile

const topName =
    document.getElementById(
        "topName"
    );


const topInitial =
    document.getElementById(
        "topInitial"
    );


const topProfileImage =
    document.getElementById(
        "topProfileImage"
    );


// Main profile

const profileImage =
    document.getElementById(
        "profileImage"
    );


const profileInitial =
    document.getElementById(
        "profileInitial"
    );


const profileName =
    document.getElementById(
        "profileName"
    );


const profileDesignation =
    document.getElementById(
        "profileDesignation"
    );


const profileInstitution =
    document.getElementById(
        "profileInstitution"
    );


const profileEmail =
    document.getElementById(
        "profileEmail"
    );


const profileBio =
    document.getElementById(
        "profileBio"
    );


// Profile completion

const profileCompletion =
    document.getElementById(
        "profileCompletion"
    );


const profileCompletionBar =
    document.getElementById(
        "profileCompletionBar"
    );


// Form

const profileForm =
    document.getElementById(
        "profileForm"
    );


const editName =
    document.getElementById(
        "editName"
    );


const editEmail =
    document.getElementById(
        "editEmail"
    );


const editHeadline =
    document.getElementById(
        "editHeadline"
    );


const editBio =
    document.getElementById(
        "editBio"
    );


const editInstitution =
    document.getElementById(
        "editInstitution"
    );


const editDepartment =
    document.getElementById(
        "editDepartment"
    );


const editDesignation =
    document.getElementById(
        "editDesignation"
    );


const editFacultyId =
    document.getElementById(
        "editFacultyId"
    );


const editQualification =
    document.getElementById(
        "editQualification"
    );


const editExperience =
    document.getElementById(
        "editExperience"
    );


const editSpecialization =
    document.getElementById(
        "editSpecialization"
    );


const editLocation =
    document.getElementById(
        "editLocation"
    );


const editPhone =
    document.getElementById(
        "editPhone"
    );


const editWebsite =
    document.getElementById(
        "editWebsite"
    );


const editLinkedIn =
    document.getElementById(
        "editLinkedIn"
    );


const editGoogleScholar =
    document.getElementById(
        "editGoogleScholar"
    );


const editORCID =
    document.getElementById(
        "editORCID"
    );


const editResearchGate =
    document.getElementById(
        "editResearchGate"
    );


// Photo

const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


// Buttons

const saveProfileButton =
    document.getElementById(
        "saveProfileButton"
    );


const saveTopButton =
    document.getElementById(
        "saveTopButton"
    );


const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


// Messages

const formMessage =
    document.getElementById(
        "formMessage"
    );


const pageLoader =
    document.getElementById(
        "pageLoader"
    );


const bioCounter =
    document.getElementById(
        "bioCounter"
    );


// Mobile

const menuButton =
    document.getElementById(
        "menuButton"
    );


const profileSidebar =
    document.getElementById(
        "profileSidebar"
    );


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "../../login.html";

            return;

        }


        currentUser =
            user;


        try {

            await loadProfile();

        }

        catch (error) {

            console.error(
                "Profile loading error:",
                error
            );


            showMessage(
                "Unable to load your profile.",
                "error"
            );

        }

        finally {

            hideLoader();

        }

    }
);


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

    // =================================================
    // LOAD USERS DOCUMENT
    // =================================================

    const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );


    const userSnapshot =
        await getDoc(
            userRef
        );


    if (
        userSnapshot.exists()
    ) {

        currentUserData =
            userSnapshot.data();

    }

    else {

        currentUserData = {

            name:
                currentUser.displayName ||
                "Academician",

            email:
                currentUser.email ||
                "",

            role:
                "academician",

            photoURL:
                "",

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            userRef,
            currentUserData
        );

    }


    // =================================================
    // ROLE CHECK
    // =================================================

    if (
        currentUserData.role &&
        currentUserData.role !==
        "academician"
    ) {

        redirectByRole(
            currentUserData.role
        );

        return;

    }


    // =================================================
    // LOAD ACADEMICIAN DOCUMENT
    // =================================================

    const academicianRef =
        doc(
            db,
            "academicians",
            currentUser.uid
        );


    const academicianSnapshot =
        await getDoc(
            academicianRef
        );


    if (
        academicianSnapshot.exists()
    ) {

        currentAcademicianData =
            academicianSnapshot.data();

    }

    else {

        currentAcademicianData = {

            institution:
                "",

            department:
                "",

            designation:
                "",

            facultyId:
                "",

            qualification:
                "",

            experience:
                "",

            specialization:
                "",

            location:
                "",

            headline:
                "",

            bio:
                "",

            phone:
                "",

            website:
                "",

            linkedin:
                "",

            googleScholar:
                "",

            orcid:
                "",

            researchGate:
                "",

            createdAt:
                serverTimestamp()

        };


        await setDoc(
            academicianRef,
            currentAcademicianData
        );

    }


    // =================================================
    // RENDER
    // =================================================

    renderProfile();

}


// =====================================================
// RENDER PROFILE
// =====================================================

function renderProfile() {

    const name =
        currentUserData.name ||
        currentUser.displayName ||
        "Academician";


    const email =
        currentUserData.email ||
        currentUser.email ||
        "";


    const photoURL =
        currentUserData.photoURL ||
        "";


    const initial =
        getInitial(
            name
        );


    // =================================================
    // TOP BAR
    // =================================================

    if (topName) {

        topName.textContent =
            name;

    }


    if (topInitial) {

        topInitial.textContent =
            initial;

    }


    // =================================================
    // PROFILE IDENTITY
    // =================================================

    if (profileName) {

        profileName.textContent =
            name;

    }


    if (profileEmail) {

        profileEmail.textContent =
            email ||
            "Email not available";

    }


    if (profileDesignation) {

        profileDesignation.textContent =
            currentAcademicianData.designation ||
            "Designation not added";

    }


    if (profileInstitution) {

        profileInstitution.textContent =
            currentAcademicianData.institution ||
            "Institution not added";

    }


    if (profileBio) {

        profileBio.textContent =
            currentAcademicianData.bio ||
            "Add a professional summary to tell students and industry partners about your academic expertise, research interests and experience.";

    }


    // =================================================
    // FORM
    // =================================================

    fillForm();


    // =================================================
    // IMAGE
    // =================================================

    if (
        photoURL &&
        photoURL.trim()
    ) {

        setProfileImage(
            photoURL
        );

    }

    else {

        showProfileInitial(
            initial
        );

    }


    // =================================================
    // COMPLETION
    // =================================================

    updateCompletion();

}


// =====================================================
// FILL FORM
// =====================================================

function fillForm() {

    const name =
        currentUserData.name ||
        currentUser.displayName ||
        "";


    const email =
        currentUserData.email ||
        currentUser.email ||
        "";


    if (editName) {

        editName.value =
            name;

    }


    if (editEmail) {

        editEmail.value =
            email;

    }


    if (editHeadline) {

        editHeadline.value =
            currentAcademicianData.headline ||
            "";

    }


    if (editBio) {

        editBio.value =
            currentAcademicianData.bio ||
            "";

    }


    if (editInstitution) {

        editInstitution.value =
            currentAcademicianData.institution ||
            "";

    }


    if (editDepartment) {

        editDepartment.value =
            currentAcademicianData.department ||
            "";

    }


    if (editDesignation) {

        editDesignation.value =
            currentAcademicianData.designation ||
            "";

    }


    if (editFacultyId) {

        editFacultyId.value =
            currentAcademicianData.facultyId ||
            "";

    }


    if (editQualification) {

        editQualification.value =
            currentAcademicianData.qualification ||
            "";

    }


    if (editExperience) {

        editExperience.value =
            currentAcademicianData.experience ||
            "";

    }


    if (editSpecialization) {

        editSpecialization.value =
            currentAcademicianData.specialization ||
            "";

    }


    if (editLocation) {

        editLocation.value =
            currentAcademicianData.location ||
            "";

    }


    if (editPhone) {

        editPhone.value =
            currentAcademicianData.phone ||
            "";

    }


    if (editWebsite) {

        editWebsite.value =
            currentAcademicianData.website ||
            "";

    }


    if (editLinkedIn) {

        editLinkedIn.value =
            currentAcademicianData.linkedin ||
            "";

    }


    if (editGoogleScholar) {

        editGoogleScholar.value =
            currentAcademicianData.googleScholar ||
            "";

    }


    if (editORCID) {

        editORCID.value =
            currentAcademicianData.orcid ||
            "";

    }


    if (editResearchGate) {

        editResearchGate.value =
            currentAcademicianData.researchGate ||
            "";

    }


    updateBioCounter();

}


// =====================================================
// PROFILE COMPLETION
// =====================================================

function calculateCompletion() {

    const fields = [

        currentUserData.name,

        currentUserData.email,

        currentUserData.photoURL,

        currentAcademicianData.headline,

        currentAcademicianData.bio,

        currentAcademicianData.institution,

        currentAcademicianData.department,

        currentAcademicianData.designation,

        currentAcademicianData.facultyId,

        currentAcademicianData.qualification,

        currentAcademicianData.experience,

        currentAcademicianData.specialization,

        currentAcademicianData.location,

        currentAcademicianData.phone,

        currentAcademicianData.website,

        currentAcademicianData.linkedin,

        currentAcademicianData.googleScholar,

        currentAcademicianData.orcid,

        currentAcademicianData.researchGate

    ];


    const completed =
        fields.filter(
            value => {

                if (
                    value === undefined ||
                    value === null
                ) {

                    return false;

                }


                return String(
                    value
                ).trim() !== "";

            }
        ).length;


    return Math.round(
        (
            completed /
            fields.length
        ) * 100
    );

}


function updateCompletion() {

    const completion =
        calculateCompletion();


    if (profileCompletion) {

        profileCompletion.textContent =
            `${completion}%`;

    }


    if (profileCompletionBar) {

        profileCompletionBar.style.width =
            `${completion}%`;

    }

}


// =====================================================
// SAVE PROFILE
// =====================================================

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            await saveProfile();

        }
    );

}


if (saveTopButton) {

    saveTopButton.addEventListener(
        "click",
        async () => {

            await saveProfile();

        }
    );

}


// =====================================================
// SAVE PROFILE FUNCTION
// =====================================================

async function saveProfile() {

    if (!currentUser) {

        showMessage(
            "Authentication session not available.",
            "error"
        );

        return;

    }


    // =================================================
    // READ VALUES
    // =================================================

    const name =
        editName.value.trim();


    const headline =
        editHeadline.value.trim();


    const bio =
        editBio.value.trim();


    const institution =
        editInstitution.value.trim();


    const department =
        editDepartment.value.trim();


    const designation =
        editDesignation.value;


    const facultyId =
        editFacultyId.value.trim();


    const qualification =
        editQualification.value.trim();


    const experience =
        editExperience.value.trim();


    const specialization =
        editSpecialization.value.trim();


    const location =
        editLocation.value.trim();


    const phone =
        editPhone.value.trim();


    const website =
        editWebsite.value.trim();


    const linkedin =
        editLinkedIn.value.trim();


    const googleScholar =
        editGoogleScholar.value.trim();


    const orcid =
        editORCID.value.trim();


    const researchGate =
        editResearchGate.value.trim();


    // =================================================
    // VALIDATION
    // =================================================

    if (!name) {

        showMessage(
            "Full name is required.",
            "error"
        );

        editName.focus();

        return;

    }


    // =================================================
    // URL VALIDATION
    // =================================================

    const urlFields = [

        {
            element:
                editWebsite,
            value:
                website,
            label:
                "Personal website"
        },

        {
            element:
                editLinkedIn,
            value:
                linkedin,
            label:
                "LinkedIn"
        },

        {
            element:
                editGoogleScholar,
            value:
                googleScholar,
            label:
                "Google Scholar"
        },

        {
            element:
                editORCID,
            value:
                orcid,
            label:
                "ORCID"
        },

        {
            element:
                editResearchGate,
            value:
                researchGate,
            label:
                "ResearchGate"
        }

    ];


    for (
        const field of urlFields
    ) {

        if (
            field.value &&
            !isValidURL(
                field.value
            )
        ) {

            showMessage(
                `${field.label} must be a valid URL.`,
                "error"
            );

            field.element.focus();

            return;

        }

    }


    // =================================================
    // SAVE BUTTON STATE
    // =================================================

    setSavingState(
        true
    );


    clearFormMessage();


    try {

        // =================================================
        // UPDATE USERS DOCUMENT
        // =================================================

        await updateDoc(

            doc(
                db,
                "users",
                currentUser.uid
            ),

            {

                name:
                    name,

                updatedAt:
                    serverTimestamp()

            }

        );


        // =================================================
        // UPDATE ACADEMICIAN DOCUMENT
        // =================================================

        await updateDoc(

            doc(
                db,
                "academicians",
                currentUser.uid
            ),

            {

                headline:
                    headline,

                bio:
                    bio,

                institution:
                    institution,

                department:
                    department,

                designation:
                    designation,

                facultyId:
                    facultyId,

                qualification:
                    qualification,

                experience:
                    experience,

                specialization:
                    specialization,

                location:
                    location,

                phone:
                    phone,

                website:
                    website,

                linkedin:
                    linkedin,

                googleScholar:
                    googleScholar,

                orcid:
                    orcid,

                researchGate:
                    researchGate,

                updatedAt:
                    serverTimestamp()

            }

        );


        // =================================================
        // UPDATE FIREBASE AUTH DISPLAY NAME
        // =================================================

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
                "Authentication profile update warning:",
                authError
            );

        }


        // =================================================
        // UPDATE LOCAL DATA
        // =================================================

        currentUserData.name =
            name;


        currentAcademicianData.headline =
            headline;


        currentAcademicianData.bio =
            bio;


        currentAcademicianData.institution =
            institution;


        currentAcademicianData.department =
            department;


        currentAcademicianData.designation =
            designation;


        currentAcademicianData.facultyId =
            facultyId;


        currentAcademicianData.qualification =
            qualification;


        currentAcademicianData.experience =
            experience;


        currentAcademicianData.specialization =
            specialization;


        currentAcademicianData.location =
            location;


        currentAcademicianData.phone =
            phone;


        currentAcademicianData.website =
            website;


        currentAcademicianData.linkedin =
            linkedin;


        currentAcademicianData.googleScholar =
            googleScholar;


        currentAcademicianData.orcid =
            orcid;


        currentAcademicianData.researchGate =
            researchGate;


        // =================================================
        // UPDATE UI
        // =================================================

        renderProfile();


        showFormMessage(
            "Profile saved successfully.",
            "success"
        );


        showMessage(
            "Profile saved successfully.",
            "success"
        );

    }

    catch (error) {

        console.error(
            "Profile save error:",
            error
        );


        showFormMessage(
            error.message ||
            "Unable to save profile.",
            "error"
        );


        showMessage(
            error.message ||
            "Unable to save profile.",
            "error"
        );

    }

    finally {

        setSavingState(
            false
        );

    }

}


// =====================================================
// PROFILE PHOTO UPLOAD
// =====================================================

if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        async () => {

            const file =
                profilePhotoInput.files[0];


            if (!file) {

                return;

            }


            // =================================================
            // FILE TYPE
            // =================================================

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

                showMessage(
                    "Please select a JPG, PNG or WebP image.",
                    "error"
                );

                profilePhotoInput.value =
                    "";

                return;

            }


            // =================================================
            // FILE SIZE
            // =================================================

            const maxSize =
                5 *
                1024 *
                1024;


            if (
                file.size >
                maxSize
            ) {

                showMessage(
                    "Image must be smaller than 5 MB.",
                    "error"
                );

                profilePhotoInput.value =
                    "";

                return;

            }


            // =================================================
            // LOCAL PREVIEW
            // =================================================

            const localURL =
                URL.createObjectURL(
                    file
                );


            setProfileImage(
                localURL
            );


            try {

                // =================================================
                // CLOUDINARY FORM DATA
                // =================================================

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


                // =================================================
                // UPLOAD
                // =================================================

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


                const cloudinaryData =
                    await response.json();


                // =================================================
                // CHECK RESPONSE
                // =================================================

                if (
                    !response.ok
                ) {

                    throw new Error(

                        cloudinaryData
                            ?.error
                            ?.message ||
                        "Cloudinary upload failed."

                    );

                }


                const imageURL =
                    cloudinaryData.secure_url;


                if (!imageURL) {

                    throw new Error(
                        "Cloudinary did not return an image URL."
                    );

                }


                // =================================================
                // SAVE URL TO USERS
                // =================================================

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


                // =================================================
                // LOCAL DATA
                // =================================================

                currentUserData.photoURL =
                    imageURL;


                // =================================================
                // UPDATE AUTH PROFILE
                // =================================================

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
                        "Firebase Auth photo update warning:",
                        authError
                    );

                }


                // =================================================
                // DISPLAY
                // =================================================

                setProfileImage(
                    imageURL
                );


                updateCompletion();


                showMessage(
                    "Profile photo updated successfully.",
                    "success"
                );

            }

            catch (error) {

                console.error(
                    "Profile image upload error:",
                    error
                );


                if (
                    currentUserData.photoURL
                ) {

                    setProfileImage(
                        currentUserData.photoURL
                    );

                }

                else {

                    showProfileInitial(
                        getInitial(
                            currentUserData.name
                        )
                    );

                }


                showMessage(
                    error.message ||
                    "Unable to upload profile photo.",
                    "error"
                );

            }

            finally {

                profilePhotoInput.value =
                    "";

                URL.revokeObjectURL(
                    localURL
                );

            }

        }
    );

}


// =====================================================
// SET PROFILE IMAGE
// =====================================================

function setProfileImage(
    imageURL
) {

    // Main image

    if (profileImage) {

        profileImage.innerHTML =
            "";

        const image =
            document.createElement(
                "img"
            );


        image.src =
            imageURL;


        image.alt =
            "Academician profile picture";


        image.onerror =
            () => {

                showProfileInitial(
                    getInitial(
                        currentUserData.name
                    )
                );

            };


        profileImage.appendChild(
            image
        );

    }


    // Topbar image

    if (topProfileImage) {

        topProfileImage.innerHTML =
            "";

        const image =
            document.createElement(
                "img"
            );


        image.src =
            imageURL;


        image.alt =
            "Academician profile picture";


        image.onerror =
            () => {

                topProfileImage.innerHTML =
                    `

                    <span id="topInitial">
                        ${escapeHTML(
                            getInitial(
                                currentUserData.name
                            )
                        )}
                    </span>

                    `;

            };


        topProfileImage.appendChild(
            image
        );

    }

}


// =====================================================
// SHOW INITIAL
// =====================================================

function showProfileInitial(
    initial
) {

    if (profileImage) {

        profileImage.innerHTML =
            `

            <span id="profileInitial">
                ${escapeHTML(initial)}
            </span>

            `;

    }


    if (topProfileImage) {

        topProfileImage.innerHTML =
            `

            <span id="topInitial">
                ${escapeHTML(initial)}
            </span>

            `;

    }

}


// =====================================================
// BIO COUNTER
// =====================================================

if (editBio) {

    editBio.addEventListener(
        "input",
        updateBioCounter
    );

}


function updateBioCounter() {

    if (!bioCounter) {

        return;

    }


    const length =
        editBio?.value?.length ||
        0;


    bioCounter.textContent =
        length;

}


// =====================================================
// SAVING STATE
// =====================================================

function setSavingState(
    saving
) {

    if (saveProfileButton) {

        saveProfileButton.disabled =
            saving;


        saveProfileButton.innerHTML =
            saving
                ? "Saving..."
                : `
                    Save Profile
                    <span>→</span>
                  `;

    }


    if (saveTopButton) {

        saveTopButton.disabled =
            saving;


        saveTopButton.textContent =
            saving
                ? "Saving..."
                : "Save Changes";

    }

}


// =====================================================
// FORM MESSAGE
// =====================================================

function showFormMessage(
    message,
    type
) {

    if (!formMessage) {

        return;

    }


    formMessage.textContent =
        message;


    formMessage.className =
        type
            ? `profile-form-message ${type}`
            : "profile-form-message";

}


function clearFormMessage() {

    showFormMessage(
        "",
        ""
    );

}


// =====================================================
// TOAST MESSAGE
// =====================================================

function showMessage(
    message,
    type
) {

    const existing =
        document.querySelector(
            ".profile-toast"
        );


    if (existing) {

        existing.remove();

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `profile-toast ${type || ""}`;


    toast.textContent =
        message;


    document.body.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        4000
    );

}


// =====================================================
// URL VALIDATION
// =====================================================

function isValidURL(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        return (
            url.protocol ===
                "http:" ||
            url.protocol ===
                "https:"
        );

    }

    catch {

        return false;

    }

}


// =====================================================
// LOADER
// =====================================================

function hideLoader() {

    if (pageLoader) {

        pageLoader.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                logoutBtn.disabled =
                    true;


                logoutBtn.textContent =
                    "Logging out...";


                await signOut(
                    auth
                );


                window.location.href =
                    "../../index.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                logoutBtn.disabled =
                    false;


                logoutBtn.innerHTML =
                    `
                    <span>↪</span>
                    Logout
                    `;


                showMessage(
                    "Unable to logout. Please try again.",
                    "error"
                );

            }

        }
    );

}


// =====================================================
// MOBILE SIDEBAR
// =====================================================

if (
    menuButton &&
    profileSidebar
) {

    menuButton.addEventListener(
        "click",
        () => {

            profileSidebar.classList.toggle(
                "open"
            );

        }
    );

}


// =====================================================
// CLOSE MOBILE SIDEBAR ON NAVIGATION
// =====================================================

document
    .querySelectorAll(
        ".profile-nav-item"
    )
    .forEach(
        item => {

            item.addEventListener(
                "click",
                () => {

                    if (profileSidebar) {

                        profileSidebar.classList.remove(
                            "open"
                        );

                    }

                }
            );

        }
    );


// =====================================================
// FUTURE PAGE PLACEHOLDERS
// =====================================================

document
    .querySelectorAll(
        ".future-page-link"
    )
    .forEach(
        link => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();


                    showMessage(
                        "This Academician feature will be implemented next.",
                        "success"
                    );

                }
            );

        }
    );


// =====================================================
// ROLE ROUTER
// =====================================================

function redirectByRole(
    role
) {

    switch (
        role
    ) {

        case "student":

            window.location.href =
                "../../student/student-home.html";

            break;


        case "industry":

            window.location.href =
                "../../industry/industry-home.html";

            break;


        case "institution":

            window.location.href =
                "../../institution/institution-home.html";

            break;


        default:

            window.location.href =
                "../../login.html";

    }

}


// =====================================================
// HELPERS
// =====================================================

function getInitial(
    name
) {

    if (
        !name ||
        !String(name).trim()
    ) {

        return "A";

    }


    return String(
        name
    )
        .trim()
        .charAt(0)
        .toUpperCase();

}


function escapeHTML(
    value
) {

    return String(
        value
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}