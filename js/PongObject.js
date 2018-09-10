class PongObject
{
    constructor()
    {
        this.group = new THREE.Group();
    }

    update() {}

    destroy()
    {
        // Clean up
        // Free memory entire hierarchy and their geo and mat
        var disposeAll = function(object)
        {
            for (let c in object.children)
            {
                if (geometry) geometry.dispose();
                if (material) material.dispose();
                disposeAll(c);
                c.dispose();
            }
        }

        for (let o in this.group)
        {
            disposeAll(o);
        }
    }
}