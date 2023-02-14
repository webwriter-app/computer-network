import { ComputerNetwork } from "../..";

export class AnimationHelper {
    static delay(time) {
        return new Promise(resolve => setTimeout(resolve, time));
    }


    static blinkingThenRemoveNode(nodeCssClass: string, nodeId: string, network: ComputerNetwork) {
        let node = network._graph.$('#' + nodeId);
        AnimationHelper.delay(400).then(() => {
            node.toggleClass(nodeCssClass, false);
            AnimationHelper.delay(400).then(() => {
                node.toggleClass(nodeCssClass, true);
                AnimationHelper.delay(400).then(() => {
                    node.toggleClass(nodeCssClass, false);
                    AnimationHelper.delay(400).then(() => {
                        node.toggleClass(nodeCssClass, true);
                        AnimationHelper.delay(400).then(() => {
                            node.toggleClass(nodeCssClass, false);
                            AnimationHelper.delay(400).then(() => {
                                node.toggleClass(nodeCssClass, true);
                                AnimationHelper.delay(400).then(() => node.remove());
                            });
                        });
                    });
                });
            });
        });

    }

    static otherBlinking(newBackgroundPath: string, nodeId: string, network: ComputerNetwork) {
        let node = network._graph.$('#' + nodeId);
        let originalBackGround = node.style("background-image");
        delete node.data()["backgroundPath"];
        var newAni = node.animation({
            style: {
                "background-image": newBackgroundPath,
            },
            duration: 400
        });
        var oriAni = node.animation({
            style: {
                "background-image": originalBackGround,
            },
            duration: 400
        });

        newAni.play().promise().then(function () {
            oriAni.play().promise().then(function () {
                newAni.play().promise().then(function () {
                    oriAni.play().promise().then(function () {
                        console.log(originalBackGround);
                        newAni.play().promise().then(function () {
                            node.remove();
                        });
                    });
                });
            });
        });
    }
}