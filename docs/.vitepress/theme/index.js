import { inBrowser, useRoute } from "vitepress";
import Theme from "vitepress/theme";
import { nextTick, onMounted, watch } from "vue";

import "./custom.css";
import "virtual:group-icons.css";

export default {
    extends: Theme,
    // This is a workaround to sync the selected tab across code groups
    setup() {
        if (inBrowser) {
            const route = useRoute();

            function showCodeWithLabel(labelText) {
                const labels = document.querySelectorAll(
                    ".vp-code-group .tabs label",
                );
                for (const label of labels) {
                    if (label.innerText === labelText) {
                        const input = document.getElementById(
                            label.getAttribute("for"),
                        );

                        if (!input.checked) {
                            label.click();
                        }
                    }
                }
            }

            let preventScroll = false;

            function bindClickEvents() {
                const labels = document.querySelectorAll(
                    ".vp-code-group .tabs label",
                );

                for (const label of labels) {
                    label.addEventListener("click", ($event) => {
                        const labelFor = label.getAttribute("for");
                        const initialRect = label.getBoundingClientRect();
                        const initialScrollY = window.scrollY;

                        localStorage.setItem("codeGroupTab", label.innerText);

                        showCodeWithLabel(label.innerText);

                        nextTick(() => {
                            if (preventScroll || !$event.isTrusted) {
                                return;
                            }

                            const labelNew = document.querySelector(
                                `label[for="${labelFor}"]`,
                            );
                            const newRect = labelNew.getBoundingClientRect();

                            const yDiff =
                                newRect.top +
                                window.scrollY -
                                (initialRect.top + initialScrollY);

                            scrollToY(initialScrollY + yDiff);
                        });
                    });
                }
            }

            function scrollToY(y) {
                window.scrollTo({
                    top: y,
                    behavior: "instant",
                });
            }

            function selectTabAndScrollToTop(tab) {
                if (!tab) {
                    return;
                }

                preventScroll = true;
                showCodeWithLabel(tab);
                nextTick(() => {
                    preventScroll = false;
                    scrollToY(0);
                });
            }

            onMounted(() =>
                nextTick(() => {
                    bindClickEvents();
                    selectTabAndScrollToTop(
                        localStorage.getItem("codeGroupTab"),
                    );
                }),
            );

            watch(
                () => route.path,
                () => {
                    nextTick(() => {
                        bindClickEvents();
                        selectTabAndScrollToTop(
                            localStorage.getItem("codeGroupTab"),
                        );
                    });
                },
            );
        }
    },
};
