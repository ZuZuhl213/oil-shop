package com.shop;

import com.shop.entity.OrderStatus;
import com.shop.service.OrderTransitions;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import static org.assertj.core.api.Assertions.assertThat;

class OrderStatusTest {
    private final OrderTransitions transitions = new OrderTransitions();

    @ParameterizedTest(name = "{0} -> {1} allowed={2}")
    @MethodSource("statusMatrix")
    void followsTheC6TransitionGraph(OrderStatus from, OrderStatus to, boolean allowed) {
        assertThat(transitions.isAllowed(from, to)).isEqualTo(allowed);
    }

    private static Stream<Arguments> statusMatrix() {
        return Stream.of(
                Arguments.of(OrderStatus.NEW, OrderStatus.NEW, true),
                Arguments.of(OrderStatus.NEW, OrderStatus.CONTACTED, true),
                Arguments.of(OrderStatus.NEW, OrderStatus.CONFIRMED, false),
                Arguments.of(OrderStatus.NEW, OrderStatus.COMPLETED, false),
                Arguments.of(OrderStatus.NEW, OrderStatus.CANCELLED, true),
                Arguments.of(OrderStatus.CONTACTED, OrderStatus.NEW, false),
                Arguments.of(OrderStatus.CONTACTED, OrderStatus.CONTACTED, true),
                Arguments.of(OrderStatus.CONTACTED, OrderStatus.CONFIRMED, true),
                Arguments.of(OrderStatus.CONTACTED, OrderStatus.COMPLETED, false),
                Arguments.of(OrderStatus.CONTACTED, OrderStatus.CANCELLED, true),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.NEW, false),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.CONTACTED, false),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.CONFIRMED, true),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.COMPLETED, true),
                Arguments.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED, true),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.NEW, false),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.CONTACTED, false),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.CONFIRMED, false),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.COMPLETED, true),
                Arguments.of(OrderStatus.COMPLETED, OrderStatus.CANCELLED, false),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.NEW, false),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.CONTACTED, false),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.CONFIRMED, false),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.COMPLETED, false),
                Arguments.of(OrderStatus.CANCELLED, OrderStatus.CANCELLED, true));
    }
}
