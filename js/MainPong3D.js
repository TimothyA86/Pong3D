/*
    Pong3D
    Timothy Allen
    ti251686
*/

//if (false) // This is just here for my intellisense to work
//var THREE = require('three');

var ROOM_DEPTH = 18;
var ROOM_WIDTH = 8;
var ROOM_HEIGHT = 4.6;
var MAX_BALL_SPEED = 1;
var MAX_DIFFICULTY = 10;
var MIN_DIFFICULTY = 1;

var difficulty = 3;

var scene;
var camera;
var renderer;
var room;
var ball;
var playerPaddle;
var aiPaddle;
var aiControl;
var playerScoreText;
var aiScoreText;

var scoreTextFont;
var hudSetup;
var hudUpdate;

var paddleContactSound;
var wallContactSound;

var playerScore = 0;
var aiScore = 0;

var roundScored = false;

function init()
{
    // If the load is successfull, use 3D text
    var onSuccess = function(font)
    {
        hudSetup = setupScoreText;
        hudUpdate = updateScoreText;

        loadSounds();
        setupScene();
        startNewRound();
        step();
    };

    // If the load is NOT successfull, use html text
    // Load can fail because of the browser security settings
    // Chrome, by default, will not allow loading local files
    var onFail = function()
    {
        hudSetup = setupScoreTextAlt;
        hudUpdate = updateScoreTextAlt;

        loadSounds();
        setupScene();
        startNewRound();
        step();
    };

    // Attemp to load font
    // When finished, start the game
    loadFont(onSuccess, onFail);
}

function step()
{
    // The main loop
    requestAnimationFrame(step);

    ball.update();
    aiControl.update();
    playerPaddle.update();
    aiPaddle.update();

    evaluateGameState();

    renderer.render(scene, camera);
}

function evaluateGameState()
{
    if (!roundScored && Math.abs(ball.sphere.center.z) > ROOM_DEPTH / 2)
    {
        // Someone has scored, increment the score
        var dir = Math.sign(ball.sphere.center.z);

        aiControl.setState(aiControl.StateEnum.Idle);

        playerScore += 1 - dir >> 1;
        aiScore += 1 + dir >> 1;

        hudUpdate();

        // Wait 1.5 seconds then start a new round
        window.setTimeout(startNewRound, 1500);

        roundScored = true; // don't want round to be scored more than once
    }
}

function setupScene()
{
    // The main scene set up
    scene = new THREE.Scene();

    setupCamera();
    setupRenderer();
    setupRoom();
    setupLights();
    setupPlayer();
    setupAi();
    setupBall();
    hudSetup();

    aiControl.setTargetBall(ball); // give the ai the ball to track

    // Create difficulty hud element
    var hud = document.createElement("div");
    hud.id = "Difficulty";
    hud.textContent = difficulty;
    hud.style =
    "\
        pointer-events: none; \
        position: absolute; \
        top: 10px; \
        right: 10px; \
        margin: 0; \
        padding: 0; \
        color: #FFFFFF; \
        z-index: 100; \
        display: block; \
        text-shadow: -1px -1px 0 1px -1px 0 -1px 1px 0 1px 1px 0; \
        font-family: input, courier, arial;\
        font-size: 40px; \
        font-weight: bold; \
         \
    ";

    document.body.appendChild(hud);

    // Difficulty change event
    document.addEventListener("keydown", function(e)
    {
        var keyCode = e.which;

        if (keyCode == Key.D)
        {
            difficulty = Math.min(difficulty + 1, MAX_DIFFICULTY);
            aiControl.applyDifficulty(difficulty);
            
            var hud = document.getElementById("Difficulty");
            hud.textContent = difficulty;
        }
        else if (keyCode == Key.A)
        {
            difficulty = Math.max(difficulty - 1, MIN_DIFFICULTY);
            aiControl.applyDifficulty(difficulty);
            
            var hud = document.getElementById("Difficulty");
            hud.textContent = difficulty;
        }
    },
    false);

    // Adjust camera and renderer if window changes size
    window.addEventListener("resize", 
    function()
    {
        var w = window.innerWidth;
        var h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    },
    false);
}

function loadFont(onSuccess, onFail)
{
    // Attempt to load the font for 3D text
    var loader = new THREE.FontLoader();

    loader.load("fonts/Input_Bold.json",
        function(font) { scoreTextFont = font; onSuccess(); },
        undefined,
        function() { onFail(); });
}

function loadSounds()
{
    paddleContactSound = new Audio("sounds/3.mp3");
    wallContactSound = new Audio("sounds/1.mp3");
}

function setupCamera()
{
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.lookAt(scene.position);
    camera.position.z += 15.3;
}

function setupRenderer()
{
    renderer = new THREE.WebGLRenderer({antialias : true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x1c1c1c, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document.body.appendChild(renderer.domElement);
}

function setupLights()
{
    var light, target;

    // Main light
    light = new THREE.SpotLight(0xFFFFFF, 1);
    light.position.set(0, ROOM_HEIGHT / 2 + 10, 0);
    light.angle = 20;
    light.penumbra = 1;
    light.castShadow = true;
    light.shadow.radius = 2;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 30;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add(light);

    // Far small light
    light = new THREE.SpotLight(0xFFFFFF, 0.5);
    light.position.set(0, ROOM_HEIGHT + 5, -ROOM_DEPTH / 2 + 4);
    light.angle = 0.3;
    light.penumbra = 0.3;
    light.castShadow = true;
    light.shadow.radius = 2;
    light.shadow.camera.near = 0.001;
    light.shadow.camera.far = 30;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add(light);

    target = new THREE.Object3D();
    target.position.z = light.position.z;
    scene.add(target);

    light.target = target;

    // Near small light
    light = new THREE.SpotLight(0xFFFFFF, 0.5);
    light.position.set(0, ROOM_HEIGHT + 5, ROOM_DEPTH / 2 - 4);
    light.angle = 0.3;
    light.penumbra = 0.3;
    light.castShadow = true;
    light.shadow.radius = 2;
    light.shadow.camera.near = 0.001;
    light.shadow.camera.far = 30;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    scene.add(light);

    target = new THREE.Object3D();
    target.position.z = light.position.z;
    scene.add(target);

    light.target = target;

    // Bottom light
    light = new THREE.SpotLight(0xFFFFFF, 0.2);
    light.position.set(0, -ROOM_HEIGHT / 2 - 10, 0);
    light.angle = 20;
    light.penumbra = 1;
    scene.add(light);

    // Back light
    light = new THREE.SpotLight(0xFFFFFF, 1);
    light.position.set(0, 0, ROOM_DEPTH / 2 + 10);
    light.angle = 10;
    light.penumbra = 1;
    scene.add(light);

    target = new THREE.Object3D();
    target.position.y = -ROOM_HEIGHT;
    target.position.z = ROOM_DEPTH / 2 - 2;
    scene.add(target);

    light.target = target;


}

function setupRoom()
{
    room = new PongRoom(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH, 'beige', 'firebrick', 'lightslategray');
    scene.add(room.group);
}

function setupPlayer()
{
    playerPaddle = new PongPaddle(1, 0.6, 0xFFFFFF, 0.3, ROOM_DEPTH / 2);
    scene.add(playerPaddle.group);

    renderer.domElement.addEventListener("mousemove",
    function(e)
    {
        // Center the paddle at the mouse coordinates
        // Code found via google -> stackoverflow
        var w = window.innerWidth;
        var h = window.innerHeight;

        var vector = new THREE.Vector3(e.clientX / w * 2 - 1, -e.clientY / h * 2 + 1, 0).unproject(camera);
        var dir = vector.sub( camera.position ).normalize();
        var distance = (playerPaddle.box.center.z - camera.position.z) / dir.z;
        var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );

        playerPaddle.setPosition(pos.x, pos.y);
    },
    false);
}

function setupAi()
{
    aiPaddle = new PongPaddle(1, 0.6, 0xFFFFFF, 0.3, -ROOM_DEPTH / 2);
    scene.add(aiPaddle.group);

    aiControl = new PongAi(aiPaddle, difficulty);
}

function setupBall()
{
    ball = new PongBall(0.25, 0xb3ad45);
    scene.add(ball.group);

    var collisionCallback = function(obj)
    {
        if (obj === playerPaddle || obj === aiPaddle)
        {
            // The ball hit a paddle, so trigger contact event for the paddle
            // Ball has a greater range of random bounce off paddles
            obj.onContact();
            ball.bounce(randomRotation(obj.box.normal, Math.PI * 0.0125));
            ball.adjustSpeed(0.02, MAX_BALL_SPEED);

            // If the paddle was a human player, ai should start to track the ball, otherwise the ai should go idle
            aiControl.setState(obj == playerPaddle ? aiControl.StateEnum.TrackBall : aiControl.StateEnum.Idle);

            paddleContactSound.currentTime = 0;
            paddleContactSound.play();
        }
        else
        {
            // The ball hit a wall and should have less of a random bounce
            ball.bounce(randomRotation(obj.box.normal, Math.PI * 0.005));

            wallContactSound.currentTime = 0;
            wallContactSound.play();
        }
    }

    // Feed the ball all the collidable objects and set the callback function
    ball.setCollidableBoxes([room.left, room.right, room.floor, room.ceiling, playerPaddle, aiPaddle], collisionCallback);
}

function setupScoreText()
{
    // Set up 3D text for scores
    var geo = new THREE.TextGeometry("00", { font: scoreTextFont, size: 1, height: 0.1 });
    var mat = new THREE.MeshToonMaterial({ color: 0x2d2d2d, shininess: 0 });

    playerScoreText = new THREE.Mesh(geo, mat);
    aiScoreText = new THREE.Mesh(geo.clone(), mat);

    
    playerScoreText.position.x += ROOM_WIDTH / 5 - 0.2;
    playerScoreText.position.y -= ROOM_HEIGHT / 2 + 0.05;
    playerScoreText.position.z += ROOM_DEPTH / 2 - 0.5;
    playerScoreText.rotation.x = Math.PI * 1.5;

    aiScoreText.position.x -= ROOM_WIDTH / 5 + 1.6;
    aiScoreText.position.y -= ROOM_HEIGHT / 2 + 0.05;
    aiScoreText.position.z += ROOM_DEPTH / 2 - 0.5;
    aiScoreText.rotation.x = -Math.PI * 0.5;

    scene.add(playerScoreText);
    scene.add(aiScoreText);
}

function updateScoreText()
{
    // Update the 3D texts for the scores
    // Would be more efficient to only update the score that changed... but eh
    var string;

    string = ("00" + playerScore).substring(("" + playerScore).length);
    playerScoreText.geometry.dispose();
    playerScoreText.geometry = new THREE.TextGeometry(string, { font: scoreTextFont, size: 1, height: 0.1 });

    string = ("00" + aiScore).substring(("" + aiScore).length)
    aiScoreText.geometry.dispose();
    aiScoreText.geometry = new THREE.TextGeometry(string, { font: scoreTextFont, size: 1, height: 0.1 });
}

function setupScoreTextAlt()
{
    // Set up HTML text for scores
    var hud = document.createElement("div");
    hud.id = "HUD";
    hud.style =
    "\
        pointer-events: none; \
        position: absolute; \
        top: 10px; \
        left: 10px; \
        margin: 0; \
        padding: 0; \
        color: #FFFFFF; \
        z-index: 100; \
        display: block; \
        text-shadow: -1px -1px 0 1px -1px 0 -1px 1px 0 1px 1px 0; \
        font-family: input, courier, arial;\
        font-size: 40px; \
        font-weight: bold; \
         \
    ";

    var playerDiv = document.createElement("div");
    playerDiv.id = "PlayerScore";
    playerDiv.textContent = "Human: 00";

    var aiDiv = document.createElement("div");
    aiDiv.id = "AiScore";
    aiDiv.textContent = "AI: 00";
    aiDiv.style = "float: right;";

    hud.appendChild(playerDiv);
    hud.appendChild(aiDiv);
    
    document.body.appendChild(hud);
}

function updateScoreTextAlt()
{
    // Update HTML scores
    var playerDiv = document.getElementById("PlayerScore");
    playerDiv.textContent = "Human: " + ("00" + playerScore).substring(("" + playerScore).length);

    var aiDiv = document.getElementById("AiScore");
    aiDiv.textContent = "AI: " + ("00" + aiScore).substring(("" + aiScore).length);
}

function resetBall()
{
    // Reset the ball to the center of the scene
    // Reset velocity and rotate velocity on a random axis (towards ai)
    ball.setPosition(0, 0, 0);
    ball.setVelocity(0.1, Math.PI * 1.5, 0);
    ball.setDirection(randomRotation(ball.velocity.clone().normalize(), Math.PI * 0.125, false));
}

function startNewRound()
{
    // Reset round state
    roundScored = false;

    resetBall();
    aiControl.setState(aiControl.StateEnum.TrackBall);
}

var randomRotation = function (vector, rotation, range = true)
{
    // Apply a random rotation on random axes
    // range indicates whether or not the rotation angle should be a +- random range or absolute
    var v = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    var a = range ? Math.random() * rotation - rotation * 0.5 : rotation;

    return vector.applyAxisAngle(v, a);
}

window.onload = init;