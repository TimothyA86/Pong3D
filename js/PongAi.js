class PongAi
{
    constructor(paddle, difficulty = 0.5)
    {
        this.StateEnum = Object.freeze(
        {
            Idle: 0,
            TrackBall: 1
        });

        this.ball = undefined;
        this.paddle = paddle;
        this.difficultyFactor = difficulty / 10;
        this.idlePosition = this.paddle.box.center.clone();
        this.state = this.setState(this.StateEnum.Idle);
    }

    applyDifficulty(difficulty)
    {
        this.difficultyFactor = difficulty / 10;
    }

    setTargetBall(ball)
    {
        this.ball = ball;
    }

    setState(state)
    {
        switch (state)
        {
        case this.StateEnum.TrackBall:
            this.state = this.trackBall();
            break;
        default:
            this.state = this.idle();
        }
    }

    * idle()
    {
        // Move back towards idle position
        var pos = this.paddle.box.center.clone();

        while (this.paddle.box.center.distanceTo(this.idlePosition) > 0.001)
        {
            pos.lerp(this.idlePosition, 0.025)
            this.paddle.setPosition(pos.x, pos.y);
            yield;
        }
    }

    * trackBall()
    {
        if (this.ball)
        {   
            // Calculate reaction time
            // Lower difficulty means slower reactions
            var delayFactor = 30 * (1 - this.difficultyFactor); // normaly I would use milli-seconds not frames
            var reactDelay = Math.random() * delayFactor | 0;

            while (reactDelay-- > 0) { yield; } // remain here while still waiting to react

            var maxSpeed = 0.25 * this.difficultyFactor; // lower difficulty means slower max speed
            var paddlePos = this.paddle.box.center.clone();
            
            var ballPos, deltaX, deltaY, direction, speed;

            while (true)
            {
                // Move towards the ball at a maximum speed (x and y axis only)
                ballPos = this.ball.sphere.center;
                deltaX = ballPos.x - paddlePos.x;
                deltaY = ballPos.y - paddlePos.y;

                direction = Math.atan2(deltaY, deltaX);
                speed = Math.min(maxSpeed, Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)));

                paddlePos.x += speed * Math.cos(direction);
                paddlePos.y += speed * Math.sin(direction);
                this.paddle.setPosition(paddlePos.x, paddlePos.y);

                yield
            }
        }
    }

    update()
    {
        // Run current state
        this.state.next();
    }
}